import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../common/decorators/current-user.decorator';
import { hashSenha, verificarSenha } from './senhas';
import { LoginDto, SenhaDto } from './auth.dto';
import { REFRESH_SECONDS, TokensService } from './tokens.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly tokens: TokensService) {}

  async login(dto: LoginDto) {
    // Resolve a empresa por CNPJ ou ID numérico. Informar os dois, ou empresa inexistente, cai na mesma resposta
    // genérica e no mesmo custo de KDF abaixo, para não revelar quais empresas existem.
    let idEmpresa = dto.idEmpresa;
    if (dto.idEmpresa && dto.cnpj) idEmpresa = undefined;
    else if (!idEmpresa && dto.cnpj) idEmpresa = (await this.prisma.empresa.findUnique({ where: { cnpj: dto.cnpj }, select: { id: true } }))?.id;
    const usuario = idEmpresa ? await this.prisma.usuario.findFirst({ where: { idEmpresa, username: dto.username } }) : null;
    const correta = await verificarSenha(dto.senha, usuario?.password);
    if (!usuario?.ativo || !correta) throw new UnauthorizedException('Empresa, usuário ou senha inválidos.');
    const expiraEm = new Date(Date.now() + REFRESH_SECONDS * 1000);
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Usuario" WHERE "id" = ${usuario.id} AND "idEmpresa" = ${usuario.idEmpresa} FOR NO KEY UPDATE`;
      const atual = await tx.usuario.findFirst({ where: { id: usuario.id, idEmpresa: usuario.idEmpresa, ativo: true, password: usuario.password } });
      if (!atual) throw new UnauthorizedException('Empresa, usuário ou senha inválidos.');
      const sessao = await tx.sessaoRefresh.create({ data: { usuarioId: usuario.id, idEmpresa: usuario.idEmpresa, tokenHash: this.tokens.hash(randomUUID()), expiraEm } });
      const par = await this.tokens.emitir({ sub: usuario.id, idEmpresa: usuario.idEmpresa, sid: sessao.id }, expiraEm);
      await tx.sessaoRefresh.updateMany({ where: { id: sessao.id }, data: { tokenHash: this.tokens.hash(par.refreshToken) } });
      return par;
    });
  }

  /** Dados de exibição para o frontend (nome, empresa, departamento) junto da identidade validada. */
  async perfil(user: UserContext) {
    const dados = await this.prisma.usuario.findFirst({
      where: { id: user.id, idEmpresa: user.idEmpresa },
      select: {
        username: true,
        pessoa: { select: { nome: true, email: true } },
        empresa: { select: { id: true, nome: true, cnpj: true } },
        departamento: { select: { id: true, nome: true, sigla: true } },
      },
    });
    return {
      ...user,
      username: dados?.username,
      nome: dados?.pessoa.nome,
      email: dados?.pessoa.email,
      empresa: dados?.empresa,
      departamento: dados?.departamento,
    };
  }

  async renovar(refreshToken: string) {
    const identidade = await this.tokens.validar(refreshToken, 'refresh');
    const resultado = await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Usuario" WHERE "id" = ${identidade.sub} AND "idEmpresa" = ${identidade.idEmpresa} FOR NO KEY UPDATE`;
      const usuario = await tx.usuario.findFirst({ where: { id: identidade.sub, idEmpresa: identidade.idEmpresa, ativo: true } });
      const where = { id: identidade.sid, usuarioId: identidade.sub, idEmpresa: identidade.idEmpresa };
      const sessao = await tx.sessaoRefresh.findFirst({ where });
      if (!usuario || !sessao || sessao.revogadoEm || sessao.expiraEm <= new Date()) return null;
      if (sessao.tokenHash !== this.tokens.hash(refreshToken)) {
        // Confirma a revogação antes de responder 401: não lançar dentro da transação.
        await tx.sessaoRefresh.updateMany({ where, data: { revogadoEm: new Date() } });
        return null;
      }
      const par = await this.tokens.emitir(identidade, sessao.expiraEm);
      const atualizado = await tx.sessaoRefresh.updateMany({
        where: { ...where, tokenHash: sessao.tokenHash, revogadoEm: null, expiraEm: { gt: new Date() } },
        data: { tokenHash: this.tokens.hash(par.refreshToken) },
      });
      return atualizado.count === 1 ? par : null;
    });
    if (!resultado) throw new UnauthorizedException('Sessão inválida, expirada ou token já utilizado. Faça login novamente.');
    return resultado;
  }

  async autenticar(accessToken: string): Promise<UserContext> {
    const identidade = await this.tokens.validar(accessToken, 'access');
    const sessao = await this.prisma.sessaoRefresh.findFirst({
      where: { id: identidade.sid, usuarioId: identidade.sub, idEmpresa: identidade.idEmpresa, revogadoEm: null, expiraEm: { gt: new Date() } },
      include: { usuario: { include: {
        permissoes: { include: { permissao: true } },
        departamento: { include: { permissoes: { include: { permissao: true } } } },
      } } },
    });
    if (!sessao?.usuario.ativo) throw new UnauthorizedException('Sessão inválida ou usuário inativo.');
    const usuario = sessao.usuario;
    const permitidas = new Set(usuario.departamento?.permissoes.map(p => p.permissao.nome) ?? []);
    const permissoes = usuario.permissoes.filter(p => permitidas.has(p.permissao.nome)).map(p => p.permissao.nome);
    return { id: usuario.id, idEmpresa: usuario.idEmpresa, departamentoId: usuario.departamentoId, sessaoId: sessao.id, permissoes };
  }

  async sair(user: UserContext, todas = false) {
    await this.prisma.sessaoRefresh.updateMany({
      where: { usuarioId: user.id, idEmpresa: user.idEmpresa, ...(todas ? {} : { id: user.sessaoId }), revogadoEm: null },
      data: { revogadoEm: new Date() },
    });
    return { encerrado: true };
  }

  async trocarSenha(user: UserContext, dto: SenhaDto) {
    const usuario = await this.prisma.usuario.findFirst({ where: { id: user.id, idEmpresa: user.idEmpresa, ativo: true } });
    if (!usuario || !await verificarSenha(dto.senhaAtual, usuario.password)) throw new UnauthorizedException('Senha atual inválida.');
    if (dto.novaSenha.length < 12 || dto.novaSenha.length > 128) throw new BadRequestException('A senha deve ter de 12 a 128 caracteres.');
    const password = await hashSenha(dto.novaSenha);
    await this.prisma.$transaction(async tx => {
      const alterado = await tx.usuario.updateMany({ where: { id: user.id, idEmpresa: user.idEmpresa, ativo: true, password: usuario.password }, data: { password } });
      if (alterado.count !== 1) throw new UnauthorizedException('Usuário alterado durante a operação. Faça login novamente.');
      await tx.sessaoRefresh.updateMany({ where: { usuarioId: user.id, idEmpresa: user.idEmpresa, revogadoEm: null }, data: { revogadoEm: new Date() } });
    });
    return { alterada: true, novoLoginNecessario: true };
  }
}
