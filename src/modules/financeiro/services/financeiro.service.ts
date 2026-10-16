import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserContext } from '../../../common/decorators/current-user.decorator';
import { CreateFinanceiroDto, StatusTransacao, TipoTransacao } from '../dto/financeiro.dto';

interface TotaisFinanceiros {
  totalReceitas: number;
  totalDespesas: number;
  saldoLiquido: number;
}

export interface FluxoCaixaResumo {
  previsto: TotaisFinanceiros;
  realizado: TotaisFinanceiros;
  periodo: { inicio: Date; fim: Date };
}

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  async criarTransacao(user: UserContext, dto: CreateFinanceiroDto) {
    const { idEmpresa } = user;

    if (dto.pedidoId) {
      const pedido = await this.prisma.pedido.findFirst({ where: { id: dto.pedidoId, idEmpresa } });
      if (!pedido) throw new BadRequestException('O pedido informado não pertence à sua empresa ou não existe.');

      const transacaoExistente = await this.prisma.transacaoFinanceira.findFirst({
        where: { pedidoId: dto.pedidoId, idEmpresa },
      });
      if (transacaoExistente) throw new BadRequestException('Este pedido já possui uma transação financeira vinculada.');
    }

    const status = dto.status ?? StatusTransacao.PENDENTE;
    if (status === StatusTransacao.CANCELADO) {
      throw new BadRequestException('Crie a transação como pendente e use um fluxo explícito de cancelamento quando necessário.');
    }

    const { status: _statusRecebido, ...dados } = dto;
    return this.prisma.transacaoFinanceira.create({
      data: {
        ...dados,
        idEmpresa,
        status,
        dataPagamento: status === StatusTransacao.PAGO ? new Date() : null,
      },
    });
  }

  async darBaixa(user: UserContext, id: string) {
    const transacao = await this.prisma.transacaoFinanceira.findFirst({
      where: { id, idEmpresa: user.idEmpresa },
    });
    if (!transacao) throw new NotFoundException('Transação financeira não encontrada.');
    if (transacao.status === StatusTransacao.PAGO) throw new BadRequestException('Esta transação já está paga/recebida.');
    if (transacao.status === StatusTransacao.CANCELADO) throw new BadRequestException('Não é possível dar baixa em uma transação cancelada.');

    const atualizada = await this.prisma.transacaoFinanceira.updateMany({
      where: {
        id,
        idEmpresa: user.idEmpresa,
        status: { notIn: [StatusTransacao.PAGO, StatusTransacao.CANCELADO] },
      },
      data: { status: StatusTransacao.PAGO, dataPagamento: new Date() },
    });
    if (atualizada.count !== 1) throw new BadRequestException('A transação foi alterada por outra operação; atualize e tente novamente.');

    return this.prisma.transacaoFinanceira.findFirst({ where: { id, idEmpresa: user.idEmpresa } });
  }

  async getFluxoCaixa(user: UserContext, dataInicio: Date, dataFim: Date): Promise<FluxoCaixaResumo> {
    if (!(dataInicio instanceof Date) || Number.isNaN(dataInicio.getTime()) || !(dataFim instanceof Date) || Number.isNaN(dataFim.getTime())) {
      throw new BadRequestException('Informe datas válidas para o período.');
    }
    if (dataInicio > dataFim) throw new BadRequestException('A data inicial não pode ser posterior à data final.');

    const [pendentes, realizados] = await Promise.all([
      this.prisma.transacaoFinanceira.findMany({
        where: {
          idEmpresa: user.idEmpresa,
          status: { in: [StatusTransacao.PENDENTE, StatusTransacao.ATRASADO] },
          dataVencimento: { gte: dataInicio, lte: dataFim },
        },
        select: { tipo: true, valor: true },
      }),
      this.prisma.transacaoFinanceira.findMany({
        where: {
          idEmpresa: user.idEmpresa,
          status: StatusTransacao.PAGO,
          dataPagamento: { gte: dataInicio, lte: dataFim },
        },
        select: { tipo: true, valor: true },
      }),
    ]);

    const somar = (transacoes: Array<{ tipo: string; valor: unknown }>): TotaisFinanceiros => {
      let totalReceitas = 0;
      let totalDespesas = 0;
      for (const transacao of transacoes) {
        const valor = Number(transacao.valor);
        if (transacao.tipo === TipoTransacao.RECEITA) totalReceitas += valor;
        else if (transacao.tipo === TipoTransacao.DESPESA) totalDespesas += valor;
      }
      return {
        totalReceitas: Number(totalReceitas.toFixed(2)),
        totalDespesas: Number(totalDespesas.toFixed(2)),
        saldoLiquido: Number((totalReceitas - totalDespesas).toFixed(2)),
      };
    };

    return {
      previsto: somar(pendentes),
      realizado: somar(realizados),
      periodo: { inicio: dataInicio, fim: dataFim },
    };
  }
}