import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../common/decorators/current-user.decorator';
import { estaNoMinimoOuAbaixo } from './estoque-regras';

@Injectable()
export class EstoqueAlertService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lista produtos cujo saldo total (almoxarifados ativos) atingiu ou ficou abaixo do mínimo. */
  async getProdutosAbaixoDoMinimo(user: UserContext) {
    const produtos = await this.prisma.produto.findMany({
      // Só carrega produtos com monitoramento habilitado.
      where: { idEmpresa: user.idEmpresa, alertaEstoqueAtivo: true },
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

      if (!estaNoMinimoOuAbaixo(saldoTotal, minimo, produto.alertaEstoqueAtivo)) return [];

      return [
        {
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
        },
      ];
    });
  }
}
