import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../common/decorators/current-user.decorator';
import { CreateMovimentacaoDto, TipoMovimentacao } from './dto/movimentacao.dto';
import Decimal from 'decimal.js';

export interface EstoqueAlerta {
  alerta: boolean;
  mensagem: string;
  qtdAtual: number;
  estoqueMinimo: number;
}

export interface MovimentacaoResponse {
  sucesso: boolean;
  novoSaldo: number;
  almoxarifadoId: string;
  alerta?: EstoqueAlerta;
}

@Injectable()
export class EstoqueService {
  constructor(private readonly prisma: PrismaService) {}

  async registrarMovimentacao(user: UserContext, dto: CreateMovimentacaoDto): Promise<MovimentacaoResponse> {
    const { idEmpresa } = user;
    const { produtoId, almoxarifadoId, quantidade, tipo, observacao } = dto;

    const [produto, almoxarifado] = await Promise.all([
      this.prisma.produto.findFirst({ where: { id: produtoId, idEmpresa } }),
      this.prisma.almoxarifado.findFirst({ where: { id: almoxarifadoId, idEmpresa, ativo: true } }),
    ]);

    if (!produto) throw new NotFoundException('Produto não encontrado para esta empresa.');
    if (!almoxarifado) throw new NotFoundException('Almoxarifado não encontrado, inativo ou pertencente a outra empresa.');

    return this.prisma.$transaction(async (tx) => {
      const chave = { idEmpresa_almoxarifadoId_produtoId: { idEmpresa, almoxarifadoId, produtoId } };
      const estoqueBase = await tx.estoque.upsert({
        where: chave,
        update: {},
        create: { idEmpresa, almoxarifadoId, produtoId, quantidade: 0 },
      });

      // Bloqueia a linha durante o cálculo para evitar duas movimentações concorrentes
      // calcularem o saldo usando a mesma quantidade anterior.
      await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Estoque" WHERE "id" = ${estoqueBase.id} FOR UPDATE`;
      const estoqueAtual = await tx.estoque.findUnique({ where: { id: estoqueBase.id } });
      if (!estoqueAtual) throw new NotFoundException('Registro de estoque não encontrado.');

      const saldoAnterior = new Decimal(estoqueAtual.quantidade.toString());
      const qtdMovimentacao = new Decimal(quantidade);
      const novoSaldo = tipo === TipoMovimentacao.ENTRADA
        ? saldoAnterior.plus(qtdMovimentacao)
        : saldoAnterior.minus(qtdMovimentacao);

      if (tipo === TipoMovimentacao.SAIDA && saldoAnterior.lt(qtdMovimentacao)) {
        throw new BadRequestException(
          `Saldo insuficiente no almoxarifado. Saldo atual: ${saldoAnterior.toFixed(3)}, tentativa de saída: ${qtdMovimentacao.toFixed(3)}.`,
        );
      }

      await tx.estoque.update({
        where: { id: estoqueAtual.id },
        data: { quantidade: novoSaldo.toFixed(3) },
      });

      await tx.estoqueMovimento.create({
        data: {
          idEmpresa,
          estoqueId: estoqueAtual.id,
          usuarioId: user.id,
          qtdAnterior: saldoAnterior.toFixed(3),
          qtdModificada: qtdMovimentacao.toFixed(3),
          observacao,
        },
      });

      const estoqueMinimo = new Decimal(produto.estoqueMinimo.toString());
      const alerta = novoSaldo.lte(estoqueMinimo)
        ? {
            alerta: true,
            mensagem: `ALERTA: ${produto.nome} atingiu ou está abaixo do estoque mínimo neste almoxarifado.`,
            qtdAtual: novoSaldo.toNumber(),
            estoqueMinimo: estoqueMinimo.toNumber(),
          }
        : undefined;

      return {
        sucesso: true,
        novoSaldo: novoSaldo.toNumber(),
        almoxarifadoId,
        alerta,
      };
    });
  }
}