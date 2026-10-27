import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../common/decorators/current-user.decorator';
import { fimDoDia, inicioDoDia } from '../../common/utils/datas';
import { EstoqueAlertService } from '../estoque/estoque-alert.service';

const DIA_MS = 24 * 60 * 60 * 1000;
const dec = (v: unknown) => new Decimal(v == null ? 0 : String(v));
const num = (v: Decimal) => v.toDecimalPlaces(2).toNumber();
// As colunas são TIMESTAMP sem fuso (UTC). Enviar texto sem fuso + ::timestamp torna a comparação
// independente do fuso configurado no servidor PostgreSQL.
const ts = (d: Date) => d.toISOString().replace('Z', '');

export interface LinhaProduto {
  produtoId: number;
  nome: string;
  sku: string;
  quantidade: number;
  receita: number;
  lucro: number | null;
  margemPercentual: number | null;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService, private readonly alertas: EstoqueAlertService) {}

  async indicadores(user: UserContext, dataInicio: string, dataFim: string) {
    const ini = inicioDoDia(dataInicio);
    const fim = fimDoDia(dataFim);
    if (Number.isNaN(ini.getTime()) || Number.isNaN(fim.getTime())) throw new BadRequestException('Data inválida.');
    if (ini > fim) throw new BadRequestException('A data inicial não pode ser posterior à data final.');
    if ((fim.getTime() - ini.getTime()) / DIA_MS > 366) throw new BadRequestException('O período máximo é de 366 dias.');

    const { idEmpresa } = user;
    const verMargem = !!user.permissoes?.includes('financeiro.ler');
    const de = ts(ini), ate = ts(fim);
    // Pedido válido = status que não é de cancelamento.
    const pedidoValido = Prisma.sql`NOT s."ehCancelamento" AND p."dataPedido" >= ${de}::timestamp AND p."dataPedido" <= ${ate}::timestamp`;

    const [resumo, serie, produtos, encalhados, abaixoMinimo] = await Promise.all([
      this.prisma.$queryRaw<{ pedidos: number; faturamento: unknown }[]>(Prisma.sql`
        SELECT COUNT(*)::int AS pedidos, COALESCE(SUM(p."valorTotal"), 0) AS faturamento
        FROM "Pedido" p JOIN "StatusPedido" s ON s.id = p."statusId" AND s."idEmpresa" = p."idEmpresa"
        WHERE p."idEmpresa" = ${idEmpresa} AND ${pedidoValido}`),
      this.prisma.$queryRaw<{ data: string; pedidos: number; faturamento: unknown }[]>(Prisma.sql`
        SELECT to_char((p."dataPedido" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS data,
               COUNT(*)::int AS pedidos, COALESCE(SUM(p."valorTotal"), 0) AS faturamento
        FROM "Pedido" p JOIN "StatusPedido" s ON s.id = p."statusId" AND s."idEmpresa" = p."idEmpresa"
        WHERE p."idEmpresa" = ${idEmpresa} AND ${pedidoValido}
        GROUP BY 1 ORDER BY 1`),
      this.prisma.$queryRaw<{ id: number; nome: string; sku: string; quantidade: unknown; receita: unknown; lucro: unknown }[]>(Prisma.sql`
        SELECT pr.id, pr.nome, pr.sku, SUM(i.quantidade) AS quantidade, SUM(i."valorTotal") AS receita,
               SUM(i."valorTotal" - i."custoUnitario" * i.quantidade) AS lucro
        FROM "ItemPedido" i
        JOIN "Pedido" p ON p.id = i."pedidoId" AND p."idEmpresa" = i."idEmpresa"
        JOIN "StatusPedido" s ON s.id = p."statusId" AND s."idEmpresa" = p."idEmpresa"
        JOIN "Produto" pr ON pr.id = i."produtoId" AND pr."idEmpresa" = i."idEmpresa"
        WHERE i."idEmpresa" = ${idEmpresa} AND ${pedidoValido}
        GROUP BY pr.id, pr.nome, pr.sku`),
      this.prisma.$queryRaw<{ id: number; nome: string; sku: string; saldo: unknown; capital: unknown }[]>(Prisma.sql`
        SELECT pr.id, pr.nome, pr.sku, SUM(e.quantidade) AS saldo, SUM(e.quantidade * pr."precoCusto") AS capital
        FROM "Estoque" e
        JOIN "Produto" pr ON pr.id = e."produtoId" AND pr."idEmpresa" = e."idEmpresa"
        JOIN "Almoxarifado" a ON a.id = e."almoxarifadoId" AND a."idEmpresa" = e."idEmpresa" AND a.ativo
        WHERE e."idEmpresa" = ${idEmpresa}
        GROUP BY pr.id, pr.nome, pr.sku
        HAVING SUM(e.quantidade) > 0 AND NOT EXISTS (
          SELECT 1 FROM "ItemPedido" i
          JOIN "Pedido" p ON p.id = i."pedidoId" AND p."idEmpresa" = i."idEmpresa"
          JOIN "StatusPedido" s ON s.id = p."statusId" AND s."idEmpresa" = p."idEmpresa"
          WHERE i."produtoId" = pr.id AND i."idEmpresa" = pr."idEmpresa" AND ${pedidoValido})
        ORDER BY SUM(e.quantidade * pr."precoCusto") DESC, pr.nome ASC LIMIT 5`),
      this.alertas.getProdutosAbaixoDoMinimo(user),
    ]);

    const pedidos = resumo[0]?.pedidos ?? 0;
    const faturamento = dec(resumo[0]?.faturamento);
    let lucroTotal = new Decimal(0);
    const linhas: LinhaProduto[] = produtos.map((p) => {
      const receita = dec(p.receita), lucro = dec(p.lucro);
      lucroTotal = lucroTotal.plus(lucro);
      return {
        produtoId: p.id, nome: p.nome, sku: p.sku,
        quantidade: dec(p.quantidade).toDecimalPlaces(3).toNumber(), receita: num(receita),
        lucro: verMargem ? num(lucro) : null,
        margemPercentual: verMargem && receita.gt(0) ? lucro.div(receita).mul(100).toDecimalPlaces(1).toNumber() : null,
      };
    });
    const porReceita = [...linhas].sort((a, b) => b.receita - a.receita || a.nome.localeCompare(b.nome));

    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      podeVerMargem: verMargem,
      vendas: {
        pedidos,
        faturamento: num(faturamento),
        ticketMedio: pedidos > 0 ? num(faturamento.div(pedidos)) : 0,
        lucroBruto: verMargem ? num(lucroTotal) : null,
        margemPercentual: verMargem && faturamento.gt(0) ? lucroTotal.div(faturamento).mul(100).toDecimalPlaces(1).toNumber() : null,
      },
      serieDiaria: serie.map((d) => ({ data: d.data, pedidos: d.pedidos, faturamento: num(dec(d.faturamento)) })),
      maisVendidos: porReceita.slice(0, 5),
      menosVendidos: [...porReceita].reverse().slice(0, 5),
      encalhados: encalhados.map((e) => ({
        produtoId: e.id, nome: e.nome, sku: e.sku, saldo: dec(e.saldo).toDecimalPlaces(3).toNumber(),
        capitalParado: verMargem ? num(dec(e.capital)) : null,
      })),
      estoque: { produtosNoMinimoOuAbaixo: abaixoMinimo.length },
    };
  }
}
