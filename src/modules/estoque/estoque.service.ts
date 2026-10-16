import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMovimentacaoDto, TipoMovimentacao } from './dto/movimentacao.dto';
import { UserContext } from '../../common/decorators/current-user.decorator';
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
  alerta?: EstoqueAlerta;
}

@Injectable()
export class EstoqueService {
  constructor(private prisma: PrismaService) {}

  async registrarMovimentacao(
    user: UserContext,
    dto: CreateMovimentacaoDto
  ): Promise<MovimentacaoResponse> {
    const { idEmpresa } = user;
    const { produtoId, quantidade, tipo, observacao } = dto;

    const produto = await this.prisma.produto.findFirst({
      where: { id: produtoId, idEmpresa },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado para esta empresa.');
    }

    return await this.prisma.$transaction(async (tx) => {
      const estoque = await tx.estoque.findUnique({
        where: { idEmpresa_produtoId: { idEmpresa, produtoId } },
      });

      // USANDO DECIMAL.JS PARA PRECISÃO
      const qtdAnterior = new Decimal(estoque ? estoque.quantidade : 0);
      const qtdMovimentacao = new Decimal(quantidade);
      let novoSaldo = qtdAnterior;

      if (tipo === TipoMovimentacao.ENTRADA) {
        novoSaldo = qtdAnterior.plus(qtdMovimentacao);
      } else {
        if (qtdAnterior.lt(qtdMovimentacao)) {
          throw new BadRequestException(
            `Saldo insuficiente. Saldo atual: ${qtdAnterior.toFixed(3)}, tentativa de saída: ${qtdMovimentacao.toFixed(3)}`
          );
        }
        novoSaldo = qtdAnterior.minus(qtdMovimentacao);
      }

      const estoqueAtualizado = await tx.estoque.upsert({
        where: { idEmpresa_produtoId: { idEmpresa, produtoId } },
        update: { quantidade: novoSaldo },
        create: {
          idEmpresa,
          produtoId,
          quantidade: novoSaldo,
        },
      });

      await tx.estoqueMovimento.create({
        data: {
          idEmpresa,
          estoqueId: estoqueAtualizado.id,
          usuarioId: user.id,
          qtdAnterior: qtdAnterior,
          qtdModificada: qtdMovimentacao,
          observacao,
        },
      });

      let alerta: EstoqueAlerta | undefined;
      const estoqueMinimo = new Decimal(produto.estoqueMinimo);

      if (novoSaldo.lte(estoqueMinimo)) {
        alerta = {
          alerta: true,
          mensagem: `ALERTA: O produto ${produto.nome} atingiu o nível crítico de estoque.`,
          qtdAtual: novoSaldo.toNumber(),
          estoqueMinimo: estoqueMinimo.toNumber(),
        };
      }

      return {
        sucesso: true,
        novoSaldo: novoSaldo.toNumber(),
        alerta,
      };
    });
  }
}
