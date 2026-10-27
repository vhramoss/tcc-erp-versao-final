import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../common/decorators/current-user.decorator';
import { fimDoDia, inicioDoDia, meioDoDia } from '../../common/utils/datas';
import { EstoqueService } from '../estoque/estoque.service';
import { TipoMovimentacao } from '../estoque/dto/movimentacao.dto';
import { FinanceiroService } from '../financeiro/services/financeiro.service';
import { CreatePedidoDto, FiltroPedidosDto } from './pedidos.dto';

const detalhes = {
  cliente: { include: { pessoa: true } }, status: true, financeiro: true,
  itens: { include: { produto: { select: { id: true, nome: true, sku: true } }, status: true }, orderBy: { id: 'asc' as const } },
} satisfies Prisma.PedidoInclude;

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService, private readonly estoque: EstoqueService, private readonly financeiro: FinanceiroService) {}

  async criar(user: UserContext, dto: CreatePedidoDto) {
    const dataVencimento = meioDoDia(dto.dataVencimento);
    if (Number.isNaN(dataVencimento.getTime())) throw new BadRequestException('Data de vencimento inválida.');
    const informada = dto.referencia?.trim();
    if (informada === '' || !dto.itens.length || dto.itens.length > 100 || new Set(dto.itens.map((i) => i.produtoId)).size !== dto.itens.length) {
      throw new BadRequestException('Informe referência e de 1 a 100 produtos distintos.');
    }
    return this.prisma.$transaction(async (tx) => {
      const idEmpresa = user.idEmpresa;
      // Mesma ordem global do estoque: protege custo e preço até concluir a venda.
      for (const item of [...dto.itens].sort((a, b) => a.produtoId - b.produtoId)) {
        await tx.$queryRaw`SELECT "id" FROM "Produto" WHERE "id" = ${item.produtoId} AND "idEmpresa" = ${idEmpresa} FOR NO KEY UPDATE`;
        await tx.$queryRaw`SELECT "id" FROM "PrecoProduto" WHERE "produtoId" = ${item.produtoId} AND "idEmpresa" = ${idEmpresa} AND "nomeTabela" = ${'Padrão'} FOR SHARE`;
      }
      const [usuario, cliente, almoxarifado, statusPedidos, statusItens, produtos] = await Promise.all([
        tx.usuario.findFirst({ where: { id: user.id, idEmpresa, ativo: true } }),
        tx.cliente.findFirst({ where: { id: dto.clienteId, idEmpresa } }),
        tx.almoxarifado.findFirst({ where: { id: dto.almoxarifadoId, idEmpresa, ativo: true } }),
        tx.statusPedido.findMany({ where: { idEmpresa, ativo: true, ...(dto.statusId ? { id: dto.statusId } : { ehInicial: true }) } }),
        tx.statusProduto.findMany({ where: { idEmpresa, ativo: true }, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }, { id: 'asc' }] }),
        tx.produto.findMany({ where: { idEmpresa, id: { in: dto.itens.map((i) => i.produtoId) } }, include: { precos: { where: { idEmpresa, nomeTabela: 'Padrão' } } } }),
      ]);
      if (!usuario || !cliente || !almoxarifado) throw new BadRequestException('Usuário, cliente ou almoxarifado inválido para esta empresa.');
      if (statusPedidos.length !== 1 || statusPedidos[0].ehFinal || statusPedidos[0].ehCancelamento) throw new BadRequestException('Configure um status inicial ativo ou informe um status ativo que não encerre o pedido.');
      if (!statusItens.length || dto.itens.some((i) => i.statusId && !statusItens.some((s) => s.id === i.statusId))) throw new BadRequestException('Configure status de itens ativos pertencentes à sua empresa.');
      if (produtos.length !== dto.itens.length) throw new BadRequestException('Há produtos que não pertencem à sua empresa.');
      const itens = dto.itens.map((item) => {
        const produto = produtos.find((p) => p.id === item.produtoId)!;
        const preco = produto.precos[0];
        if (!preco) throw new BadRequestException(`Produto ${produto.nome} sem preço padrão cadastrado.`);
        const quantidade = new Decimal(item.quantidade);
        const valorUnitario = new Decimal(preco.precoVenda.toString());
        const custoUnitario = new Decimal(produto.precoCusto.toString());
        if (!quantidade.isFinite() || quantidade.lte(0) || quantidade.gt('999999999.999') || quantidade.decimalPlaces() > 3 ||
            !valorUnitario.isFinite() || valorUnitario.lte(0) || valorUnitario.gt('99999999.99') ||
            !custoUnitario.isFinite() || custoUnitario.lt(0) || valorUnitario.lt(custoUnitario)) {
          throw new BadRequestException('Quantidade inválida ou preço de venda inválido/abaixo do custo.');
        }
        // Compatibilidade com clientes antigos: o valor enviado só confirma o cadastro.
        if (item.valorUnitario != null && !valorUnitario.eq(item.valorUnitario)) {
          throw new BadRequestException('O preço informado difere do preço padrão cadastrado. Atualize o pedido.');
        }
        const valorTotal = quantidade.mul(valorUnitario).toDecimalPlaces(2);
        if (valorTotal.lte(0) || valorTotal.gt('9999999999.99')) throw new BadRequestException('Total do item fora do limite permitido.');
        return { produtoId: item.produtoId, statusId: item.statusId, quantidade: quantidade.toFixed(3), valorUnitario: valorUnitario.toFixed(2), custoUnitario: custoUnitario.toFixed(2), valorTotal: valorTotal.toFixed(2) };
      });
      const total = itens.reduce((soma, item) => soma.plus(item.valorTotal), new Decimal(0));
      if (total.gt('9999999999.99')) throw new BadRequestException('Total do pedido excede o limite permitido.');
      const [gerado] = await tx.$queryRaw<{ id: number }[]>`SELECT nextval(pg_get_serial_sequence('"Pedido"', 'id'))::integer AS id`;
      const referencia = informada ?? `PED-${String(gerado.id).padStart(6, '0')}`;
      const pedido = await tx.pedido.create({ data: {
        id: gerado.id,
        idEmpresa, referencia, clienteId: cliente.id, usuarioId: usuario.id, almoxarifadoId: almoxarifado.id,
        formaPagamentoId: dto.formaPagamentoId ?? null, statusId: statusPedidos[0].id,
        valorTotal: total.toFixed(2), observacao: dto.observacao,
      } });
      await tx.itemPedido.createMany({ data: itens.map((item) => ({ ...item, statusId: item.statusId ?? statusItens[0].id, idEmpresa, pedidoId: pedido.id })) });
      const alertas = [];
      // Mesma ordem de bloqueio das compras; cada produto é protegido até o commit.
      for (const item of [...itens].sort((a, b) => a.produtoId - b.produtoId)) {
        const resultado = await this.estoque.aplicarMovimentacao(tx, { idEmpresa, usuarioId: usuario.id }, {
          produtoId: item.produtoId, almoxarifadoId: almoxarifado.id, quantidade: item.quantidade,
          tipo: TipoMovimentacao.SAIDA, observacao: `Pedido ${referencia}`, pedidoId: pedido.id,
        });
        if (resultado.alerta) alertas.push({ produtoId: item.produtoId, ...resultado.alerta });
      }
      await this.financeiro.criarReceitaDePedido(tx, {
        idEmpresa, pedidoId: pedido.id, valor: total, dataVencimento, descricao: `Pedido ${referencia}`,
        formaPagamentoId: dto.formaPagamentoId, planoContasId: dto.planoContasId, centroCustoId: dto.centroCustoId,
      });
      return { ...await tx.pedido.findFirstOrThrow({ where: { id: pedido.id, idEmpresa }, include: detalhes }), alertas };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 60000 });
  }

  async listar(user: UserContext, filtro: FiltroPedidosDto) {
    const inicio = filtro.dataInicio ? inicioDoDia(filtro.dataInicio) : undefined;
    const fim = filtro.dataFim ? fimDoDia(filtro.dataFim) : undefined;
    if (inicio && Number.isNaN(inicio.getTime()) || fim && Number.isNaN(fim.getTime()) || inicio && fim && inicio > fim) throw new BadRequestException('Período inválido.');
    const page = filtro.page ?? 1, limit = filtro.limit ?? 20;
    const where: Prisma.PedidoWhereInput = {
      idEmpresa: user.idEmpresa, ...(filtro.statusId ? { statusId: filtro.statusId } : {}),
      ...(filtro.clienteId ? { clienteId: filtro.clienteId } : {}),
      ...(inicio || fim ? { dataPedido: { ...(inicio ? { gte: inicio } : {}), ...(fim ? { lte: fim } : {}) } } : {}),
    };
    const [items, total] = await this.prisma.$transaction((tx) => Promise.all([
      tx.pedido.findMany({ where, include: { cliente: { include: { pessoa: true } }, status: true, financeiro: true }, orderBy: [{ dataPedido: 'desc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
      tx.pedido.count({ where }),
    ]), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    return { items, total, page, limit };
  }

  async buscar(user: UserContext, id: number) {
    const pedido = await this.prisma.pedido.findFirst({ where: { id, idEmpresa: user.idEmpresa }, include: detalhes });
    if (!pedido) throw new NotFoundException('Pedido não encontrado.');
    return pedido;
  }

  async alterarStatus(user: UserContext, id: number, statusId: number) {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await this.bloquearPedido(tx, user, id);
      if (pedido.statusId === statusId) return pedido;
      if (pedido.status.ehFinal || pedido.status.ehCancelamento) throw new BadRequestException('Pedido encerrado não pode mudar de status.');
      const status = await tx.statusPedido.findFirst({ where: { id: statusId, idEmpresa: user.idEmpresa, ativo: true } });
      if (!status) throw new BadRequestException('Status inválido para esta empresa.');
      if (status.ehCancelamento) {
        // A baixa financeira concorrente vence ou perde a atualização condicional.
        // Qualquer conflito impede também o estorno de estoque.
        await this.financeiro.cancelarDoPedido(tx, user.idEmpresa, id);
        for (const item of [...pedido.itens].sort((a, b) => a.produtoId - b.produtoId)) {
          await this.estoque.aplicarMovimentacao(tx, { idEmpresa: user.idEmpresa, usuarioId: user.id }, {
            produtoId: item.produtoId, almoxarifadoId: pedido.almoxarifadoId, quantidade: item.quantidade.toString(),
            tipo: TipoMovimentacao.ENTRADA, observacao: `Cancelamento do pedido ${pedido.referencia}`, pedidoId: id,
          });
        }
      }
      return tx.pedido.update({ where: { id, idEmpresa: user.idEmpresa }, data: { statusId: status.id }, include: detalhes });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 60000 });
  }

  async alterarStatusItem(user: UserContext, pedidoId: number, itemId: number, statusId: number) {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await this.bloquearPedido(tx, user, pedidoId);
      if (pedido.status.ehFinal || pedido.status.ehCancelamento) throw new BadRequestException('Não é possível alterar itens de um pedido encerrado.');
      if (!pedido.itens.some((i) => i.id === itemId)) throw new NotFoundException('Item não encontrado neste pedido.');
      const status = await tx.statusProduto.findFirst({ where: { id: statusId, idEmpresa: user.idEmpresa, ativo: true } });
      if (!status) throw new BadRequestException('Status de item inválido para esta empresa.');
      return tx.itemPedido.update({ where: { id: itemId, idEmpresa: user.idEmpresa, pedidoId }, data: { statusId: status.id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  }

  private async bloquearPedido(tx: Prisma.TransactionClient, user: UserContext, id: number) {
    const usuario = await tx.usuario.findFirst({ where: { id: user.id, idEmpresa: user.idEmpresa, ativo: true } });
    if (!usuario) throw new BadRequestException('Usuário inválido para esta empresa.');
    await tx.$queryRaw`SELECT "id" FROM "Pedido" WHERE "id" = ${id} AND "idEmpresa" = ${user.idEmpresa} FOR NO KEY UPDATE`;
    const pedido = await tx.pedido.findFirst({ where: { id, idEmpresa: user.idEmpresa }, include: detalhes });
    if (!pedido) throw new NotFoundException('Pedido não encontrado.');
    return pedido;
  }
}
