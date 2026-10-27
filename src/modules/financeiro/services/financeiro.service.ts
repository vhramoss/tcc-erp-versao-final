import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserContext } from '../../../common/decorators/current-user.decorator';
import { fimDoDia, hojeLocal, inicioDoDia, meioDoDia } from '../../../common/utils/datas';
import {
  CreateFinanceiroDto,
  FiltroTransacoesDto,
  StatusTransacao,
  TipoTransacao,
} from '../dto/financeiro.dto';

export interface TotaisFinanceiros {
  totalReceitas: number;
  totalDespesas: number;
  saldoLiquido: number;
}

export interface FluxoCaixaResumo {
  periodo: { inicio: string; fim: string };
  /** A pagar/receber: pendentes com vencimento dentro do período. */
  previsto: TotaisFinanceiros;
  /** Já pago/recebido: pagos com data de pagamento dentro do período. */
  realizado: TotaisFinanceiros;
  /** Realizado + previsto: como o período deve fechar se tudo for cumprido. */
  saldoProjetado: number;
  /** Pendentes já vencidos (antes de hoje), de qualquer período. */
  emAtraso: TotaisFinanceiros;
}

export interface ReceitaDePedidoInput {
  idEmpresa: number;
  pedidoId: number;
  valor: Decimal.Value;
  dataVencimento: Date;
  descricao: string;
  formaPagamentoId?: number;
  planoContasId?: number;
  centroCustoId?: number;
}

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------- criação manual

  async criarTransacao(user: UserContext, dto: CreateFinanceiroDto) {
    const { idEmpresa } = user;
    const dataVencimento = this.data(dto.dataVencimento, 'meio');
    await this.validarVinculos(idEmpresa, dto);

    const status = dto.status ?? StatusTransacao.PENDENTE;
    if (dto.dataPagamento != null && status !== StatusTransacao.PAGO) {
      throw new BadRequestException('Informe a data de pagamento apenas para uma transação paga/recebida.');
    }
    return this.prisma.transacaoFinanceira.create({
      data: {
        idEmpresa,
        descricao: dto.descricao,
        valor: new Decimal(dto.valor).toFixed(2),
        tipo: dto.tipo,
        dataVencimento,
        status,
        dataPagamento: status === StatusTransacao.PAGO ? this.dataPagamento(dto.dataPagamento) : null,
        planoContasId: dto.planoContasId ?? null,
        centroCustoId: dto.centroCustoId ?? null,
        formaPagamentoId: dto.formaPagamentoId ?? null,
      },
    });
  }

  // ---------------------------------------------------------------- listagem

  async listar(user: UserContext, filtro: FiltroTransacoesDto) {
    const { idEmpresa } = user;
    const page = filtro.page ?? 1;
    const limit = filtro.limit ?? 20;

    const where: Prisma.TransacaoFinanceiraWhereInput = {
      idEmpresa,
      ...(filtro.status ? { status: filtro.status } : {}),
      ...(filtro.tipo ? { tipo: filtro.tipo } : {}),
    };
    if (filtro.dataInicio || filtro.dataFim) {
      where.dataVencimento = {
        ...(filtro.dataInicio ? { gte: this.data(filtro.dataInicio, 'inicio') } : {}),
        ...(filtro.dataFim ? { lte: this.data(filtro.dataFim, 'fim') } : {}),
      };
    }

    const [itens, total] = await Promise.all([
      this.prisma.transacaoFinanceira.findMany({
        where,
        orderBy: [{ dataVencimento: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          planoContas: { select: { id: true, codigo: true, nome: true } },
          centroCusto: { select: { id: true, nome: true } },
          formaPagamento: { select: { id: true, nome: true } },
        },
      }),
      this.prisma.transacaoFinanceira.count({ where }),
    ]);

    const inicioHoje = inicioDoDia(hojeLocal());
    return {
      items: itens.map((t) => ({
        ...t,
        atrasado: t.status === StatusTransacao.PENDENTE && t.dataVencimento < inicioHoje,
      })),
      total,
      page,
      limit,
    };
  }

  // ---------------------------------------------------------------- baixa e cancelamento

  async darBaixa(user: UserContext, id: number, dataPagamento?: string) {
    const pagamento = this.dataPagamento(dataPagamento);
    const transacao = await this.buscar(user.idEmpresa, id);
    if (transacao.status === StatusTransacao.PAGO) throw new BadRequestException('Esta transação já está paga/recebida.');
    if (transacao.status === StatusTransacao.CANCELADO) throw new BadRequestException('Não é possível dar baixa em uma transação cancelada.');

    // Condição de status no WHERE: se outra requisição alterou no meio, count = 0.
    const atualizada = await this.prisma.transacaoFinanceira.updateMany({
      where: { id, idEmpresa: user.idEmpresa, status: StatusTransacao.PENDENTE },
      data: { status: StatusTransacao.PAGO, dataPagamento: pagamento },
    });
    if (atualizada.count !== 1) throw new BadRequestException('A transação foi alterada por outra operação; atualize e tente novamente.');

    return this.buscar(user.idEmpresa, id);
  }

  async cancelar(user: UserContext, id: number) {
    const transacao = await this.buscar(user.idEmpresa, id);
    if (transacao.pedidoId) {
      throw new BadRequestException('Este lançamento pertence a um pedido. Cancele o pedido para cancelar o lançamento.');
    }
    if (transacao.compraId) {
      throw new BadRequestException('Não é possível cancelar isoladamente o financeiro de uma compra recebida.');
    }
    if (transacao.status === StatusTransacao.CANCELADO) throw new BadRequestException('Esta transação já está cancelada.');
    if (transacao.status === StatusTransacao.PAGO) throw new BadRequestException('Não é possível cancelar uma transação já paga/recebida.');

    const atualizada = await this.prisma.transacaoFinanceira.updateMany({
      where: { id, idEmpresa: user.idEmpresa, status: StatusTransacao.PENDENTE },
      data: { status: StatusTransacao.CANCELADO },
    });
    if (atualizada.count !== 1) throw new BadRequestException('A transação foi alterada por outra operação; atualize e tente novamente.');

    return this.buscar(user.idEmpresa, id);
  }

  // ---------------------------------------------------------------- fluxo de caixa

  async getFluxoCaixa(user: UserContext, dataInicio: string, dataFim: string): Promise<FluxoCaixaResumo> {
    const inicio = this.data(dataInicio, 'inicio');
    const fim = this.data(dataFim, 'fim');
    if (inicio > fim) throw new BadRequestException('A data inicial não pode ser posterior à data final.');

    const { idEmpresa } = user;
    const inicioHoje = inicioDoDia(hojeLocal());

    // As três somas usam a mesma visão do banco, mesmo que uma baixa seja
    // confirmada durante a consulta. Uma receita não pode aparecer duas vezes.
    const [previsto, realizado, emAtraso] = await this.prisma.$transaction(
      (tx) => Promise.all([
        this.somarPorTipo(tx, { idEmpresa, status: StatusTransacao.PENDENTE, dataVencimento: { gte: inicio, lte: fim } }),
        this.somarPorTipo(tx, { idEmpresa, status: StatusTransacao.PAGO, dataPagamento: { gte: inicio, lte: fim } }),
        this.somarPorTipo(tx, { idEmpresa, status: StatusTransacao.PENDENTE, dataVencimento: { lt: inicioHoje } }),
      ]),
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );

    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      previsto,
      realizado,
      saldoProjetado: new Decimal(realizado.saldoLiquido).plus(previsto.saldoLiquido).toDecimalPlaces(2).toNumber(),
      emAtraso,
    };
  }

  // ---------------------------------------------------------------- uso interno (passo 4)

  /**
   * Gera a conta a receber de um pedido DENTRO da transação do pedido (tx).
   * Se algo falhar depois, o rollback do pedido desfaz este lançamento também.
   */
  async criarReceitaDePedido(tx: Prisma.TransactionClient, input: ReceitaDePedidoInput) {
    await this.validarVinculos(input.idEmpresa, { ...input, tipo: TipoTransacao.RECEITA }, tx);
    return tx.transacaoFinanceira.create({
      data: {
        idEmpresa: input.idEmpresa,
        pedidoId: input.pedidoId,
        descricao: input.descricao,
        valor: new Decimal(input.valor).toFixed(2),
        tipo: TipoTransacao.RECEITA,
        status: StatusTransacao.PENDENTE,
        dataVencimento: input.dataVencimento,
        formaPagamentoId: input.formaPagamentoId ?? null,
        planoContasId: input.planoContasId ?? null,
        centroCustoId: input.centroCustoId ?? null,
      },
    });
  }

  /** Cancela o lançamento do pedido dentro da transação de cancelamento do pedido. */
  async cancelarDoPedido(tx: Prisma.TransactionClient, idEmpresa: number, pedidoId: number) {
    const transacao = await tx.transacaoFinanceira.findFirst({ where: { pedidoId, idEmpresa } });
    if (!transacao) throw new BadRequestException('O pedido não possui lançamento financeiro para cancelar.');
    if (transacao.status === StatusTransacao.PAGO) {
      throw new BadRequestException('O recebimento deste pedido já foi efetuado; estorne-o antes de cancelar o pedido.');
    }
    if (transacao.status === StatusTransacao.CANCELADO) return transacao;

    const cancelada = await tx.transacaoFinanceira.updateMany({
      where: { id: transacao.id, idEmpresa, status: StatusTransacao.PENDENTE },
      data: { status: StatusTransacao.CANCELADO },
    });
    if (cancelada.count !== 1) throw new BadRequestException('O recebimento foi alterado por outra operação; atualize o pedido.');
    return { ...transacao, status: StatusTransacao.CANCELADO };
  }

  // ---------------------------------------------------------------- auxiliares

  private async buscar(idEmpresa: number, id: number) {
    const transacao = await this.prisma.transacaoFinanceira.findFirst({ where: { id, idEmpresa } });
    if (!transacao) throw new NotFoundException('Transação financeira não encontrada.');
    return transacao;
  }

  private dataPagamento(valor?: string): Date {
    return valor == null ? new Date() : this.data(valor, 'meio');
  }

  private data(valor: string, modo: 'inicio' | 'meio' | 'fim'): Date {
    const conversor = modo === 'inicio' ? inicioDoDia : modo === 'fim' ? fimDoDia : meioDoDia;
    const resultado = conversor(valor);
    if (Number.isNaN(resultado.getTime())) throw new BadRequestException(`Data inválida: ${valor}.`);
    return resultado;
  }

  /** Garante que plano de contas, centro de custo e forma de pagamento são da empresa do usuário. */
  private async validarVinculos(
    idEmpresa: number,
    v: { tipo: TipoTransacao; planoContasId?: number; centroCustoId?: number; formaPagamentoId?: number },
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const [plano, centro, forma] = await Promise.all([
      v.planoContasId ? db.planoContas.findFirst({ where: { id: v.planoContasId, idEmpresa } }) : null,
      v.centroCustoId ? db.centroCusto.findFirst({ where: { id: v.centroCustoId, idEmpresa } }) : null,
      v.formaPagamentoId ? db.formaPagamento.findFirst({ where: { id: v.formaPagamentoId, idEmpresa } }) : null,
    ]);

    if (v.planoContasId && !plano) throw new BadRequestException('O plano de contas informado não pertence à sua empresa.');
    if (v.centroCustoId && !centro) throw new BadRequestException('O centro de custo informado não pertence à sua empresa.');
    if (v.formaPagamentoId && (!forma || !forma.ativo)) {
      throw new BadRequestException('A forma de pagamento informada não existe, está inativa ou pertence a outra empresa.');
    }
    if (plano && plano.tipo !== v.tipo) {
      throw new BadRequestException(`O plano de contas é de ${plano.tipo}, mas o lançamento é de ${v.tipo}.`);
    }
  }

  /** Soma no banco (groupBy) e acumula com Decimal: sem erro de ponto flutuante. */
  private async somarPorTipo(tx: Prisma.TransactionClient, where: Prisma.TransacaoFinanceiraWhereInput): Promise<TotaisFinanceiros> {
    const grupos = await tx.transacaoFinanceira.groupBy({
      by: ['tipo'],
      where,
      _sum: { valor: true },
    });

    let receitas = new Decimal(0);
    let despesas = new Decimal(0);
    for (const grupo of grupos) {
      const soma = new Decimal((grupo._sum.valor ?? 0).toString());
      if (grupo.tipo === TipoTransacao.RECEITA) receitas = receitas.plus(soma);
      else if (grupo.tipo === TipoTransacao.DESPESA) despesas = despesas.plus(soma);
    }

    return {
      totalReceitas: receitas.toDecimalPlaces(2).toNumber(),
      totalDespesas: despesas.toDecimalPlaces(2).toNumber(),
      saldoLiquido: receitas.minus(despesas).toDecimalPlaces(2).toNumber(),
    };
  }
}
