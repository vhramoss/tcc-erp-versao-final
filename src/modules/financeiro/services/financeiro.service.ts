import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFinanceiroDto, TipoTransacao, StatusTransacao } from '../dto/financeiro.dto';
import { UserContext } from '../../common/decorators/current-user.decorator';

export interface FluxoCaixaResumo {
  totalReceitas: number;
  totalDespesas: number;
  saldoLiquido: number;
  periodo: {
    inicio: Date;
    fim: Date;
  };
}

@Injectable()
export class FinanceiroService {
  constructor(private prisma: PrismaService) {}

  async criarTransacao(user: UserContext, dto: CreateFinanceiroDto) {
    const { idEmpresa } = user;

    return this.prisma.transacaoFinanceira.create({
      data: {
        ...dto,
        idEmpresa,
        status: dto.status || StatusTransacao.PENDENTE,
      },
    });
  }

  async darBaixa(user: UserContext, id: string) {
    const { idEmpresa } = user;

    const transacao = await this.prisma.transacaoFinanceira.findFirst({
      where: { id, idEmpresa },
    });

    if (!transacao) {
      throw new NotFoundException('Transação financeira não encontrada.');
    }

    if (transacao.status === StatusTransacao.PAGO) {
      throw new BadRequestException('Esta transação já está paga.');
    }

    return this.prisma.transacaoFinanceira.update({
      where: { id },
      data: {
        status: StatusTransacao.PAGO,
        dataPagamento: new Date(),
      },
    });
  }

  async getFluxoCaixa(user: UserContext, dataInicio: Date, dataFim: Date): Promise<FluxoCaixaResumo> {
    const { idEmpresa } = user;

    const transacoes = await this.prisma.transacaoFinanceira.findMany({
      where: {
        idEmpresa,
        dataVencimento: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
    });

    let totalReceitas = 0;
    let totalDespesas = 0;

    transacoes.forEach((t) => {
      const valor = Number(t.valor);
      if (t.tipo === TipoTransacao.RECEITA) {
        totalReceitas += valor;
      } else {
        totalDespesas += valor;
      }
    });

    return {
      totalReceitas,
      totalDespesas,
      saldoLiquido: totalReceitas - totalDespesas,
      periodo: { inicio: dataInicio, fim: dataFim },
    };
  }
}
