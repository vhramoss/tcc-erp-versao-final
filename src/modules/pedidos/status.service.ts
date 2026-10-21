import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../common/decorators/current-user.decorator';
import { CreateStatusPedidoDto, CreateStatusProdutoDto, UpdateStatusDto } from './status.dto';

@Injectable()
export class StatusService {
  constructor(private readonly prisma: PrismaService) {}

  criarPedido(user: UserContext, dto: CreateStatusPedidoDto) {
    const ehInicial = dto.ehInicial ?? false;
    const ehCancelamento = dto.ehCancelamento ?? false;
    const ehFinal = ehCancelamento || (dto.ehFinal ?? false);
    const ativo = dto.ativo ?? true;
    if (ehInicial && (ehFinal || !ativo)) throw new BadRequestException('O status inicial deve ser ativo e não pode ser final ou de cancelamento.');
    return this.prisma.$transaction(async (tx) => {
      // Serializa a seleção do status inicial por empresa.
      await tx.$queryRaw`SELECT "id" FROM "Empresa" WHERE "id" = ${user.idEmpresa} FOR NO KEY UPDATE`;
      if (ehInicial) await tx.statusPedido.updateMany({ where: { idEmpresa: user.idEmpresa, ehInicial: true }, data: { ehInicial: false } });
      return tx.statusPedido.create({ data: { idEmpresa: user.idEmpresa, nome: dto.nome.trim(), ordem: dto.ordem ?? 0, ativo, ehInicial, ehFinal, ehCancelamento } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  }
  listarPedidos(user: UserContext) {
    return this.prisma.statusPedido.findMany({ where: { idEmpresa: user.idEmpresa }, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] });
  }
  async atualizarPedido(user: UserContext, id: string, dto: UpdateStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Empresa" WHERE "id" = ${user.idEmpresa} FOR NO KEY UPDATE`;
      const status = await tx.statusPedido.findFirst({ where: { id, idEmpresa: user.idEmpresa } });
      if (!status) throw new NotFoundException('Status de pedido não encontrado.');
      if (status.ehInicial && dto.ativo === false) {
        throw new BadRequestException('Cadastre outro status inicial antes de desativar este.');
      }
      return tx.statusPedido.update({ where: { id, idEmpresa: user.idEmpresa }, data: { ...dto, ...(dto.nome != null ? { nome: dto.nome.trim() } : {}) } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  }

  criarProduto(user: UserContext, dto: CreateStatusProdutoDto) {
    return this.prisma.statusProduto.create({ data: { idEmpresa: user.idEmpresa, nome: dto.nome.trim(), ordem: dto.ordem ?? 0, ativo: dto.ativo ?? true } });
  }
  listarProdutos(user: UserContext) {
    return this.prisma.statusProduto.findMany({ where: { idEmpresa: user.idEmpresa }, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] });
  }
  async atualizarProduto(user: UserContext, id: string, dto: UpdateStatusDto) {
    const status = await this.prisma.statusProduto.findFirst({ where: { id, idEmpresa: user.idEmpresa } });
    if (!status) throw new NotFoundException('Status de item não encontrado.');
    return this.prisma.statusProduto.update({ where: { id, idEmpresa: user.idEmpresa }, data: { ...dto, ...(dto.nome != null ? { nome: dto.nome.trim() } : {}) } });
  }
}
