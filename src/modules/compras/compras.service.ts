import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../common/decorators/current-user.decorator';
import { meioDoDia } from '../../common/utils/datas';
import { EstoqueService } from '../estoque/estoque.service';
import { TipoMovimentacao } from '../estoque/dto/movimentacao.dto';
import { CreateCompraDto } from './compras.dto';

@Injectable()
export class ComprasService {
  constructor(private readonly prisma: PrismaService, private readonly estoque: EstoqueService) {}

  async criar(user: UserContext, dto: CreateCompraDto) {
    const idEmpresa = user.idEmpresa;
    const vencimento = meioDoDia(dto.dataVencimento);
    const emissao = dto.nota ? meioDoDia(dto.nota.dataEmissao) : null;
    if (Number.isNaN(vencimento.getTime()) || emissao && Number.isNaN(emissao.getTime())) throw new BadRequestException('Data de vencimento ou emissão inválida.');
    const referencia = dto.referencia.trim();
    if (!referencia || !dto.itens.length || dto.itens.length > 990) throw new BadRequestException('Informe a referência e de 1 a 990 itens.');
    const itens = dto.itens.map((i, indice) => {
      const quantidade = new Decimal(i.quantidade), unitario = new Decimal(i.valorUnitario);
      if (!quantidade.isFinite() || quantidade.lte(0) || quantidade.gt('999999999.999') || quantidade.decimalPlaces() > 3 || !unitario.isFinite() || unitario.lt(0) || unitario.gte('100000000000') || unitario.decimalPlaces() > 10) throw new BadRequestException('Quantidade ou valor unitário inválido.');
      const total = quantidade.mul(unitario).toDecimalPlaces(2);
      if (total.gt('9999999999.99')) throw new BadRequestException('Valor do item excede o limite.');
      return { produtoId: i.produtoId, sequencia: indice + 1, quantidade: quantidade.toFixed(3), valorUnitario: unitario.toFixed(10), valorTotal: total.toFixed(2) };
    });
    const acrescimos = new Decimal(dto.acrescimos ?? 0), desconto = new Decimal(dto.desconto ?? 0);
    for (const valor of [acrescimos, desconto]) if (!valor.isFinite() || valor.lt(0) || valor.gt('9999999999.99') || valor.decimalPlaces() > 2) throw new BadRequestException('Acréscimos ou desconto inválidos.');
    const total = itens.reduce((s, i) => s.plus(i.valorTotal), new Decimal(0)).plus(acrescimos).minus(desconto);
    if (total.lte(0) || total.gt('9999999999.99')) throw new BadRequestException('O total da compra deve ser positivo e caber no limite financeiro.');

    return this.prisma.$transaction(async (tx) => {
      const [usuario, fornecedor, almoxarifado, forma] = await Promise.all([
        tx.usuario.findFirst({ where: { id: user.id, idEmpresa } }),
        tx.fornecedor.findFirst({ where: { id: dto.fornecedorId, idEmpresa }, include: { pessoa: true } }),
        tx.almoxarifado.findFirst({ where: { id: dto.almoxarifadoId, idEmpresa, ativo: true } }),
        dto.formaPagamentoId ? tx.formaPagamento.findFirst({ where: { id: dto.formaPagamentoId, idEmpresa, ativo: true } }) : null,
      ]);
      if (!usuario || !fornecedor || !almoxarifado || dto.formaPagamentoId && !forma) throw new BadRequestException('Usuário, fornecedor, almoxarifado ou forma de pagamento inválidos para esta empresa.');
      const produtos = await tx.produto.findMany({ where: { idEmpresa, id: { in: itens.map((i) => i.produtoId) } } });
      const porId = new Map(produtos.map((p) => [p.id, p]));
      if (itens.some((i) => !porId.has(i.produtoId))) throw new BadRequestException('Há produtos que não pertencem à sua empresa.');
      const compra = await tx.compra.create({ data: {
        idEmpresa, referencia, fornecedorId: fornecedor.id, usuarioId: usuario.id, almoxarifadoId: almoxarifado.id,
        valorTotal: total.toFixed(2), acrescimos: acrescimos.toFixed(2), desconto: desconto.toFixed(2),
        notaNumero: dto.nota ? String(Number(dto.nota.numero)) : null,
        notaSerie: dto.nota ? String(Number(dto.nota.serie)) : null,
        notaChave: dto.nota?.chave ?? null, notaEmissao: emissao, observacao: dto.observacao,
      } });
      await tx.itemCompra.createMany({ data: itens.map((i) => ({ ...i, idEmpresa, compraId: compra.id })) });
      const alertas = new Map<number, object>();
      // Ordem estável de bloqueio reduz deadlocks entre compras.
      for (const item of [...itens].sort((a, b) => a.produtoId - b.produtoId)) {
        const resultado = await this.estoque.aplicarMovimentacao(tx, { idEmpresa, usuarioId: usuario.id }, {
          produtoId: item.produtoId, almoxarifadoId: almoxarifado.id, quantidade: item.quantidade,
          tipo: TipoMovimentacao.ENTRADA, observacao: `Compra ${referencia}`, compraId: compra.id,
        });
        if (resultado.alerta) alertas.set(item.produtoId, { produtoId: item.produtoId, ...resultado.alerta });
        else alertas.delete(item.produtoId);
      }
      const financeiro = await tx.transacaoFinanceira.create({ data: {
        idEmpresa, compraId: compra.id, descricao: `Compra ${referencia}`, valor: total.toFixed(2),
        tipo: 'DESPESA', status: 'PENDENTE', dataVencimento: vencimento, formaPagamentoId: dto.formaPagamentoId ?? null,
      } });
      return { ...compra, itens, financeiro, alertas: [...alertas.values()] };
    }, { timeout: 60000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  }

  listar(user: UserContext) {
    return this.prisma.compra.findMany({ where: { idEmpresa: user.idEmpresa }, include: { fornecedor: { include: { pessoa: true } }, financeiro: true }, orderBy: { createdAt: 'desc' } });
  }
  async buscar(user: UserContext, id: number) {
    const compra = await this.prisma.compra.findFirst({ where: { id, idEmpresa: user.idEmpresa }, include: { itens: { orderBy: { sequencia: 'asc' } }, fornecedor: { include: { pessoa: true } }, financeiro: true, movimentos: true } });
    if (!compra) throw new NotFoundException('Compra não encontrada.');
    return compra;
  }
}
