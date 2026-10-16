import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoMovimentoEstoque } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../common/decorators/current-user.decorator';
import { CreateMovimentacaoDto, TipoMovimentacao } from './dto/movimentacao.dto';
import { estaNoMinimoOuAbaixo } from './estoque-regras';

export interface EstoqueAlerta {
  alerta: boolean;
  mensagem: string;
  /** Saldo total do produto (soma dos almoxarifados ativos). */
  qtdAtual: number;
  estoqueMinimo: number;
}

export interface MovimentacaoResponse {
  sucesso: boolean;
  /** Novo saldo do produto NO almoxarifado movimentado. */
  novoSaldo: number;
  almoxarifadoId: string;
  alerta?: EstoqueAlerta;
}

export interface ContextoMovimentacao {
  idEmpresa: string;
  usuarioId: string;
}

export interface DadosMovimentacao {
  produtoId: string;
  almoxarifadoId: string;
  quantidade: Decimal.Value;
  tipo: TipoMovimentacao;
  observacao: string;
  /** Preenchido quando a movimentação nasce de um pedido (permite rastrear e estornar). */
  pedidoId?: string;
}

@Injectable()
export class EstoqueService {
  constructor(private readonly prisma: PrismaService) {}

  /** Entrada pública (HTTP): abre a própria transação. */
  async registrarMovimentacao(user: UserContext, dto: CreateMovimentacaoDto): Promise<MovimentacaoResponse> {
    return this.prisma.$transaction((tx) =>
      this.aplicarMovimentacao(tx, { idEmpresa: user.idEmpresa, usuarioId: user.id }, dto),
    );
  }

  /**
   * Núcleo da movimentação. Recebe um cliente de transação (tx) para poder ser
   * reutilizado DENTRO de outra transação, como a criação de pedido no passo 4
   * (transações interativas do Prisma não aninham).
   */
  async aplicarMovimentacao(
    tx: Prisma.TransactionClient,
    ctx: ContextoMovimentacao,
    dados: DadosMovimentacao,
  ): Promise<MovimentacaoResponse> {
    const { idEmpresa, usuarioId } = ctx;
    const { produtoId, almoxarifadoId, tipo, observacao, pedidoId } = dados;
    const quantidade = new Decimal(dados.quantidade);

    const [produto, almoxarifado] = await Promise.all([
      tx.produto.findFirst({ where: { id: produtoId, idEmpresa } }),
      tx.almoxarifado.findFirst({ where: { id: almoxarifadoId, idEmpresa, ativo: true } }),
    ]);
    if (!produto) throw new NotFoundException('Produto não encontrado para esta empresa.');
    if (!almoxarifado) throw new NotFoundException('Almoxarifado não encontrado, inativo ou pertencente a outra empresa.');

    const chave = { idEmpresa_almoxarifadoId_produtoId: { idEmpresa, almoxarifadoId, produtoId } };
    const estoqueBase = await tx.estoque.upsert({
      where: chave,
      update: {},
      create: { idEmpresa, almoxarifadoId, produtoId, quantidade: 0 },
    });

    // Trava a linha durante o cálculo: duas movimentações concorrentes não podem
    // calcular o saldo a partir da mesma quantidade anterior.
    await tx.$queryRaw`SELECT "id" FROM "Estoque" WHERE "id" = ${estoqueBase.id} FOR UPDATE`;
    const estoqueAtual = await tx.estoque.findUnique({ where: { id: estoqueBase.id } });
    if (!estoqueAtual) throw new NotFoundException('Registro de estoque não encontrado.');

    const saldoAnterior = new Decimal(estoqueAtual.quantidade.toString());
    if (tipo === TipoMovimentacao.SAIDA && saldoAnterior.lt(quantidade)) {
      throw new BadRequestException(
        `Saldo insuficiente em "${almoxarifado.nome}" para ${produto.nome}. Saldo atual: ${saldoAnterior.toFixed(3)}, tentativa de saída: ${quantidade.toFixed(3)}.`,
      );
    }
    const novoSaldo = tipo === TipoMovimentacao.ENTRADA ? saldoAnterior.plus(quantidade) : saldoAnterior.minus(quantidade);

    await tx.estoque.update({
      where: { id: estoqueAtual.id },
      data: { quantidade: novoSaldo.toFixed(3) },
    });

    await tx.estoqueMovimento.create({
      data: {
        idEmpresa,
        estoqueId: estoqueAtual.id,
        usuarioId,
        pedidoId: pedidoId ?? null,
        tipo: tipo === TipoMovimentacao.ENTRADA ? TipoMovimentoEstoque.ENTRADA : TipoMovimentoEstoque.SAIDA,
        qtdAnterior: saldoAnterior.toFixed(3),
        qtdModificada: quantidade.toFixed(3),
        qtdPosterior: novoSaldo.toFixed(3),
        observacao,
      },
    });

    // Alerta pela regra única: saldo TOTAL do produto vs mínimo do produto.
    const soma = await tx.estoque.aggregate({
      where: { idEmpresa, produtoId, almoxarifado: { is: { ativo: true } } },
      _sum: { quantidade: true },
    });
    const saldoTotal = new Decimal((soma._sum.quantidade ?? 0).toString());
    const estoqueMinimo = new Decimal(produto.estoqueMinimo.toString());

    const alerta: EstoqueAlerta | undefined = estaNoMinimoOuAbaixo(saldoTotal, estoqueMinimo)
      ? {
          alerta: true,
          mensagem: `ALERTA: ${produto.nome} atingiu ou está abaixo do estoque mínimo (soma de todos os almoxarifados).`,
          qtdAtual: saldoTotal.toNumber(),
          estoqueMinimo: estoqueMinimo.toNumber(),
        }
      : undefined;

    return { sucesso: true, novoSaldo: novoSaldo.toNumber(), almoxarifadoId, alerta };
  }
}
