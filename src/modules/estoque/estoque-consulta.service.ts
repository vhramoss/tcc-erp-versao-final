import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../common/decorators/current-user.decorator';
import { estaNoMinimoOuAbaixo } from './estoque-regras';
import { FiltroMovimentosDto, FiltroSaldosDto } from './estoque-consulta.dto';

/** Consultas de estoque (somente leitura) usadas pelas telas de saldo e de histórico. */
@Injectable()
export class EstoqueConsultaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Saldo por produto: total (almoxarifados ativos), detalhe por almoxarifado e situação frente ao mínimo. */
  async saldos(user: UserContext, filtro: FiltroSaldosDto) {
    const { idEmpresa } = user;
    const page = filtro.page ?? 1;
    const limit = filtro.limit ?? 20;
    const busca = filtro.busca?.trim();
    const where: Prisma.ProdutoWhereInput = {
      idEmpresa,
      ...(busca ? { OR: [{ nome: { contains: busca, mode: 'insensitive' } }, { sku: { contains: busca, mode: 'insensitive' } }] } : {}),
    };

    const [produtos, total] = await Promise.all([
      this.prisma.produto.findMany({
        where,
        select: {
          id: true, nome: true, sku: true, estoqueMinimo: true, alertaEstoqueAtivo: true,
          unidadeMedida: { select: { sigla: true } },
          estoques: { select: { almoxarifadoId: true, quantidade: true, almoxarifado: { select: { nome: true, ativo: true } } } },
        },
        orderBy: [{ nome: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.produto.count({ where }),
    ]);

    const items = produtos.map((p) => {
      const ativos = p.estoques.filter((e) => e.almoxarifado.ativo);
      const saldoTotal = ativos.reduce((soma, e) => soma.plus(e.quantidade.toString()), new Decimal(0));
      const minimo = new Decimal(p.estoqueMinimo.toString());
      return {
        produtoId: p.id,
        nome: p.nome,
        sku: p.sku,
        unidade: p.unidadeMedida.sigla,
        saldoTotal: saldoTotal.toNumber(),
        estoqueMinimo: minimo.toNumber(),
        alertaEstoqueAtivo: p.alertaEstoqueAtivo,
        noMinimoOuAbaixo: estaNoMinimoOuAbaixo(saldoTotal, minimo, p.alertaEstoqueAtivo),
        almoxarifados: p.estoques.map((e) => ({
          almoxarifadoId: e.almoxarifadoId,
          almoxarifado: e.almoxarifado.nome,
          ativo: e.almoxarifado.ativo,
          quantidade: Number(e.quantidade),
        })),
      };
    });
    return { items, total, page, limit };
  }

  /** Histórico de movimentações (entradas, saídas, estornos), mais recentes primeiro. */
  async movimentos(user: UserContext, filtro: FiltroMovimentosDto) {
    const { idEmpresa } = user;
    const page = filtro.page ?? 1;
    const limit = filtro.limit ?? 20;
    const where: Prisma.EstoqueMovimentoWhereInput = {
      idEmpresa,
      ...(filtro.produtoId || filtro.almoxarifadoId
        ? { estoque: { is: { idEmpresa, ...(filtro.produtoId ? { produtoId: filtro.produtoId } : {}), ...(filtro.almoxarifadoId ? { almoxarifadoId: filtro.almoxarifadoId } : {}) } } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.estoqueMovimento.findMany({
        where,
        select: {
          id: true, tipo: true, qtdAnterior: true, qtdModificada: true, qtdPosterior: true, observacao: true, createdAt: true,
          pedidoId: true, compraId: true,
          estoque: { select: { produto: { select: { id: true, nome: true, sku: true } }, almoxarifado: { select: { id: true, nome: true } } } },
          usuario: { select: { username: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.estoqueMovimento.count({ where }),
    ]);
    return { items, total, page, limit };
  }
}
