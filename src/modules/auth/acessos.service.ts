import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../common/decorators/current-user.decorator';
import { AtualizarUsuarioDto, DepartamentoDto, UsuarioDto } from './auth.dto';
import { PERMISSOES } from './auth.decorators';
import { hashSenha } from './senhas';

const usuarioPublico = { id: true, idEmpresa: true, username: true, ativo: true, pessoaId: true, departamentoId: true, permissoes: { include: { permissao: true } } } satisfies Prisma.UsuarioSelect;

@Injectable()
export class AcessosService {
  constructor(private readonly prisma: PrismaService) {}
  catalogo() { return PERMISSOES; }
  departamentos(user: UserContext) {
    return this.prisma.departamento.findMany({ where: { idEmpresa: user.idEmpresa }, include: { permissoes: { include: { permissao: true } } }, orderBy: { nome: 'asc' } });
  }
  criarDepartamento(user: UserContext, dto: DepartamentoDto) {
    return this.prisma.departamento.create({ data: { idEmpresa: user.idEmpresa, ...dto } });
  }
  usuarios(user: UserContext) {
    return this.prisma.usuario.findMany({ where: { idEmpresa: user.idEmpresa }, select: usuarioPublico, orderBy: { username: 'asc' } });
  }
  private async bloquearEmpresa(tx: Prisma.TransactionClient, idEmpresa: string) {
    await tx.$queryRaw`SELECT "id" FROM "Empresa" WHERE "id" = ${idEmpresa} FOR NO KEY UPDATE`;
  }
  private async permissoes(tx: Prisma.TransactionClient, nomes: string[]) {
    if (new Set(nomes).size !== nomes.length || nomes.some(n => !PERMISSOES.includes(n))) throw new BadRequestException('Permissão desconhecida ou repetida.');
    const lista = [];
    // Ordem estável para não disputar o catálogo global em ordens diferentes.
    for (const nome of [...nomes].sort()) lista.push(await tx.permissao.upsert({ where: { nome }, update: {}, create: { nome } }));
    return lista as { id: string; nome: string }[];
  }
  async definirDepartamento(user: UserContext, id: string, nomes: string[]) {
    return this.prisma.$transaction(async tx => {
      await this.bloquearEmpresa(tx, user.idEmpresa);
      const departamento = await tx.departamento.findFirst({ where: { id, idEmpresa: user.idEmpresa } });
      if (!departamento) throw new NotFoundException('Departamento não encontrado.');
      if (id === user.departamentoId && !nomes.includes('acessos.gerenciar')) throw new BadRequestException('Mantenha a gestão de acessos no seu próprio departamento.');
      const permissoes = await this.permissoes(tx, nomes);
      await tx.departamentoPermissao.deleteMany({ where: { departamentoId: id, idEmpresa: user.idEmpresa } });
      await tx.departamentoPermissao.createMany({ data: permissoes.map(p => ({ idEmpresa: user.idEmpresa, departamentoId: id, permissaoId: p.id })) });
      return { departamentoId: id, permissoes: nomes };
    });
  }
  private async validarDepartamento(tx: Prisma.TransactionClient, idEmpresa: string, id: string, nomes?: string[]) {
    const departamento = await tx.departamento.findFirst({ where: { id, idEmpresa }, include: { permissoes: { include: { permissao: true } } } });
    if (!departamento) throw new BadRequestException('Departamento inválido para esta empresa.');
    const permitidas = new Set(departamento.permissoes.map(p => p.permissao.nome));
    if (nomes?.some(n => !permitidas.has(n))) throw new BadRequestException('Permissões do usuário devem estar autorizadas no departamento.');
  }
  async criarUsuario(user: UserContext, dto: UsuarioDto) {
    if (!!dto.pessoaId === !!dto.pessoa) throw new BadRequestException('Informe pessoaId ou os dados de pessoa, apenas um deles.');
    const password = await hashSenha(dto.senha);
    return this.prisma.$transaction(async tx => {
      await this.bloquearEmpresa(tx, user.idEmpresa);
      await this.validarDepartamento(tx, user.idEmpresa, dto.departamentoId, dto.permissoes);
      const permissoes = await this.permissoes(tx, dto.permissoes);
      const pessoa = dto.pessoaId
        ? await tx.pessoa.findFirst({ where: { id: dto.pessoaId, idEmpresa: user.idEmpresa } })
        : await tx.pessoa.create({ data: { ...dto.pessoa!, idEmpresa: user.idEmpresa } });
      if (!pessoa) throw new BadRequestException('Pessoa inválida para esta empresa.');
      const usuario = await tx.usuario.create({ data: { idEmpresa: user.idEmpresa, pessoaId: pessoa.id, departamentoId: dto.departamentoId, username: dto.username, password }, select: { id: true } });
      await tx.usuarioPermissao.createMany({ data: permissoes.map(p => ({ idEmpresa: user.idEmpresa, usuarioId: usuario.id, permissaoId: p.id })) });
      return tx.usuario.findFirstOrThrow({ where: { id: usuario.id, idEmpresa: user.idEmpresa }, select: usuarioPublico });
    });
  }
  async definirUsuario(user: UserContext, id: string, nomes: string[]) {
    return this.prisma.$transaction(async tx => {
      await this.bloquearEmpresa(tx, user.idEmpresa);
      const usuario = await tx.usuario.findFirst({ where: { id, idEmpresa: user.idEmpresa } });
      if (!usuario) throw new NotFoundException('Usuário não encontrado.');
      if (id === user.id && !nomes.includes('acessos.gerenciar')) throw new BadRequestException('Não remova sua própria gestão de acessos.');
      if (!usuario.departamentoId) throw new BadRequestException('Vincule o usuário a um departamento.');
      await this.validarDepartamento(tx, user.idEmpresa, usuario.departamentoId, nomes);
      const permissoes = await this.permissoes(tx, nomes);
      await tx.usuarioPermissao.deleteMany({ where: { usuarioId: id, idEmpresa: user.idEmpresa } });
      await tx.usuarioPermissao.createMany({ data: permissoes.map(p => ({ idEmpresa: user.idEmpresa, usuarioId: id, permissaoId: p.id })) });
      return { usuarioId: id, permissoes: nomes };
    });
  }
  async atualizarUsuario(user: UserContext, id: string, dto: AtualizarUsuarioDto) {
    if (id === user.id) throw new BadRequestException('Use outro gestor para alterar seu departamento ou ativação.');
    return this.prisma.$transaction(async tx => {
      await this.bloquearEmpresa(tx, user.idEmpresa);
      const usuario = await tx.usuario.findFirst({ where: { id, idEmpresa: user.idEmpresa } });
      if (!usuario) throw new NotFoundException('Usuário não encontrado.');
      if (dto.departamentoId) await this.validarDepartamento(tx, user.idEmpresa, dto.departamentoId);
      const atualizado = await tx.usuario.update({ where: { id, idEmpresa: user.idEmpresa }, data: dto, select: usuarioPublico });
      if (dto.departamentoId && dto.departamentoId !== usuario.departamentoId) {
        // Não transporta permissões de um setor para outro.
        await tx.usuarioPermissao.deleteMany({ where: { usuarioId: id, idEmpresa: user.idEmpresa } });
        atualizado.permissoes = [];
      }
      await tx.sessaoRefresh.updateMany({ where: { usuarioId: id, idEmpresa: user.idEmpresa, revogadoEm: null }, data: { revogadoEm: new Date() } });
      return atualizado;
    });
  }
}
