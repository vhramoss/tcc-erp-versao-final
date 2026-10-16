import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../common/decorators/current-user.decorator';

@Injectable()
export class EstoqueAlertService {
  constructor(private readonly prisma: PrismaService) {}

  async getProdutosAbaixoDoMinimo(user: UserContext) {
    const produtos = await this.prisma.produto.findMany({
      where: { idEmpresa: user.idEmpresa },
      include: {
        estoques: {
          where: { almoxarifado: { is: { ativo: true } } },
          include: { almoxarifado: { select: { id: true, nome: true } } },
        },
      },
      orderBy: { nome: 'asc' },
    });

    return produtos.flatMap((produto) => {
      const saldoTotal = produto.estoques.reduce(
        (total, estoque) => total.plus(estoque.quantidade.toString()),
        new Decimal(0),
      );
      const minimo = new Decimal(produto.estoqueMinimo.toString());

      if (saldoTotal.gt(minimo)) return [];

      return [{
        produtoId: produto.id,
        sku: produto.sku,
        nome: produto.nome,
        saldoAtual: saldoTotal.toNumber(),
        estoqueMinimo: minimo.toNumber(),
        abaixoDoMinimo: saldoTotal.lt(minimo),
        almoxarifados: produto.estoques.map((estoque) => ({
          almoxarifadoId: estoque.almoxarifadoId,
          almoxarifado: estoque.almoxarifado.nome,
          quantidade: Number(estoque.quantidade),
        })),
      }];
    });
  }
}