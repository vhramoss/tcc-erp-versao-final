'use client';
import { AlertTriangle, ArrowRight, Boxes, Package, Percent, Receipt, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge, Card, CardBody, CardHeader, EmptyState, Input, Skeleton, StatCard } from '@/components/ui';
import { cn } from '@/lib/cn';
import { brl, dataBR, diaMes, fimDoMes, hojeISO, inicioDoMes, numero, percentual, somarDias } from '@/lib/format';
import { useCan } from '@/lib/use-auth';
import { useAlertas } from '@/modules/estoque/api';
import { useFluxoCaixa } from '@/modules/financeiro/api';
import { useIndicadores, type LinhaProduto } from './api';

const PRESETS = [
  { chave: 'hoje', rotulo: 'Hoje', faixa: () => [hojeISO(), hojeISO()] },
  { chave: '7', rotulo: '7 dias', faixa: () => [somarDias(hojeISO(), -6), hojeISO()] },
  { chave: '30', rotulo: '30 dias', faixa: () => [somarDias(hojeISO(), -29), hojeISO()] },
  { chave: 'mes', rotulo: 'Este mês', faixa: () => [inicioDoMes(hojeISO()), fimDoMes(hojeISO())] },
  { chave: 'custom', rotulo: 'Personalizado', faixa: () => [somarDias(hojeISO(), -29), hojeISO()] },
] as const;

const saudacao = () => { const h = Number(new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).format(new Date())); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

/** Todos os dias do período (dias sem venda aparecem com zero, para o gráfico não "pular"). */
function preencherDias(inicio: string, fim: string, serie: { data: string; faturamento: number; pedidos: number }[]) {
  const mapa = new Map(serie.map((s) => [s.data, s]));
  const dias: { data: string; faturamento: number; pedidos: number }[] = [];
  for (let d = inicio, n = 0; d <= fim && n < 400; d = somarDias(d, 1), n++) dias.push(mapa.get(d) ?? { data: d, faturamento: 0, pedidos: 0 });
  return dias;
}

export function DashboardView() {
  const { me, ler, verCustos } = useCan();
  const [preset, setPreset] = useState<(typeof PRESETS)[number]['chave']>('30');
  const [inicio, setInicio] = useState(() => somarDias(hojeISO(), -29));
  const [fim, setFim] = useState(() => hojeISO());

  const escolher = (chave: (typeof PRESETS)[number]['chave']) => {
    setPreset(chave);
    if (chave !== 'custom') { const [a, b] = PRESETS.find((p) => p.chave === chave)!.faixa(); setInicio(a); setFim(b); }
  };

  const verVendas = ler('pedidos'), verFin = ler('financeiro'), verEstoque = ler('estoque');
  const ind = useIndicadores(inicio, fim, verVendas);
  const fluxo = useFluxoCaixa(inicio, fim, verFin);
  const alertas = useAlertas(verEstoque);
  const v = ind.data?.vendas;
  const dias = useMemo(() => (ind.data ? preencherDias(inicio, fim, ind.data.serieDiaria) : []), [ind.data, inicio, fim]);
  const primeiroNome = (me?.nome ?? me?.username ?? '').split(' ')[0];

  if (me && !verVendas && !verFin && !verEstoque) return <SemIndicadores nome={primeiroNome} />;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><h1 className="text-xl font-semibold sm:text-2xl">{saudacao()}{primeiroNome && `, ${primeiroNome}`} 👋</h1><p className="mt-1 text-sm text-muted">Resumo do negócio de {dataBR(inicio)} a {dataBR(fim)}.</p></div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Período">
            {PRESETS.map((p) => <button key={p.chave} type="button" aria-pressed={preset === p.chave} onClick={() => escolher(p.chave)} className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition', preset === p.chave ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted hover:bg-surface-2')}>{p.rotulo}</button>)}
          </div>
          {preset === 'custom' && <div className="flex items-end gap-2"><Input aria-label="De" type="date" value={inicio} max={fim} onChange={(e) => setInicio(e.target.value)} className="w-40" /><Input aria-label="Até" type="date" value={fim} min={inicio} onChange={(e) => setFim(e.target.value)} className="w-40" /></div>}
        </div>
      </div>

      {verVendas && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard titulo="Faturamento" valor={brl(v?.faturamento)} detalhe="Pedidos não cancelados" icone={Wallet} tom="marca" carregando={ind.isPending} destaque />
            <StatCard titulo="Pedidos" valor={numero(v?.pedidos)} detalhe={v && v.pedidos > 0 ? `Média de ${numero(v.pedidos / Math.max(dias.length, 1), 1)} por dia` : 'Nenhum no período'} icone={ShoppingCart} tom="info" carregando={ind.isPending} />
            <StatCard titulo="Ticket médio" valor={brl(v?.ticketMedio)} detalhe="Faturamento ÷ pedidos" icone={Receipt} tom="sucesso" carregando={ind.isPending} />
            {ind.data?.podeVerMargem
              ? <StatCard titulo="Margem bruta" valor={v?.margemPercentual != null ? percentual(v.margemPercentual) : '—'} detalhe={v?.lucroBruto != null ? `Lucro bruto de ${brl(v.lucroBruto)}` : undefined} icone={Percent} tom="alerta" carregando={ind.isPending} />
              : <StatCard titulo="Estoque no mínimo" valor={numero(ind.data?.estoque.produtosNoMinimoOuAbaixo)} detalhe="Produtos para repor" icone={Boxes} tom="alerta" carregando={ind.isPending} />}
          </div>

          <Card className="mt-6">
            <CardHeader titulo="Faturamento por dia" descricao="Soma dos pedidos não cancelados." />
            <CardBody>
              {ind.error ? <p className="py-10 text-center text-sm text-danger">{ind.error.message}</p> : ind.isPending ? <Skeleton className="h-64 w-full" /> : v && v.pedidos === 0 ? <EmptyState icone={TrendingUp} titulo="Sem vendas no período" descricao="Quando houver pedidos, a evolução diária aparece aqui." /> : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dias} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="grad-fat" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.35} /><stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid stroke="hsl(var(--line))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="data" tickFormatter={diaMes} tickLine={false} axisLine={false} minTickGap={24} tick={{ fill: 'hsl(var(--muted))', fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} width={64} tick={{ fill: 'hsl(var(--muted))', fontSize: 12 }} tickFormatter={(x: number) => (x >= 1000 ? `${Math.round(x / 1000)} mil` : String(x))} />
                      <Tooltip formatter={(x) => [brl(x), 'Faturamento']} labelFormatter={(d) => dataBR(String(d))} contentStyle={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--line))', borderRadius: 12, fontSize: 12 }} />
                      <Area type="monotone" dataKey="faturamento" stroke="hsl(var(--brand))" strokeWidth={2.5} fill="url(#grad-fat)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {verFin && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold">Fluxo de caixa no período</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard titulo="Saldo realizado" valor={brl(fluxo.data?.realizado.saldoLiquido)} detalhe={fluxo.data && `${brl(fluxo.data.realizado.totalReceitas)} entrou · ${brl(fluxo.data.realizado.totalDespesas)} saiu`} icone={Wallet} tom={fluxo.data && fluxo.data.realizado.saldoLiquido < 0 ? 'perigo' : 'sucesso'} carregando={fluxo.isPending} />
            <StatCard titulo="A receber" valor={brl(fluxo.data?.previsto.totalReceitas)} icone={TrendingUp} tom="info" carregando={fluxo.isPending} />
            <StatCard titulo="A pagar" valor={brl(fluxo.data?.previsto.totalDespesas)} icone={Receipt} tom="alerta" carregando={fluxo.isPending} />
            <StatCard titulo="Saldo projetado" valor={brl(fluxo.data?.saldoProjetado)} detalhe="Realizado + previsto" icone={Percent} tom="marca" carregando={fluxo.isPending} />
          </div>
          {fluxo.data && fluxo.data.emAtraso.totalReceitas + fluxo.data.emAtraso.totalDespesas > 0 && (
            <Link href="/financeiro?aba=lancamentos" className="mt-4 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger hover:brightness-95"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span><strong>Contas vencidas em aberto:</strong> {brl(fluxo.data.emAtraso.totalReceitas)} a receber e {brl(fluxo.data.emAtraso.totalDespesas)} a pagar.</span></Link>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {verVendas && <>
          <Ranking titulo="Mais vendidos" descricao="Por receita no período" icone={TrendingUp} linhas={ind.data?.maisVendidos} carregando={ind.isPending} verMargem={!!ind.data?.podeVerMargem} />
          <Ranking titulo="Menos vendidos" descricao="Venderam, mas pouco" icone={Package} linhas={v && v.pedidos > 0 ? ind.data?.menosVendidos : []} carregando={ind.isPending} verMargem={!!ind.data?.podeVerMargem} />
          <Card>
            <CardHeader titulo="Estoque parado" descricao="Têm saldo e não venderam no período" />
            {ind.isPending ? <CardBody><Skeleton className="h-32 w-full" /></CardBody> : !ind.data?.encalhados.length ? <EmptyState icone={Boxes} titulo="Nada parado" descricao="Todo produto com saldo teve venda." /> : (
              <ul className="divide-y divide-line">{ind.data.encalhados.map((e) => (
                <li key={e.produtoId} className="flex items-center justify-between gap-3 px-5 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{e.nome}</p><p className="text-xs text-muted">{e.sku} · saldo {numero(e.saldo, 3)}</p></div>{e.capitalParado != null && <span className="num shrink-0 text-sm font-semibold text-warning">{brl(e.capitalParado)}</span>}</li>))}</ul>
            )}
          </Card>
        </>}
        {verEstoque && (
          <Card className={cn(verVendas ? 'xl:col-span-3' : 'xl:col-span-3')}>
            <CardHeader titulo="Alertas de reposição" descricao="Produtos no estoque mínimo ou abaixo" acao={<Link href="/estoque?aba=alertas" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">Ver todos<ArrowRight className="size-3" /></Link>} />
            {alertas.isPending ? <CardBody><Skeleton className="h-20 w-full" /></CardBody> : !alertas.data?.length ? <EmptyState icone={Boxes} titulo="Estoque saudável" descricao="Nenhum produto atingiu o mínimo configurado." /> : (
              <ul className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0">{alertas.data.slice(0, 6).map((a) => (
                <li key={a.produtoId} className="flex items-center justify-between gap-3 border-line px-5 py-3 sm:border-b"><div className="min-w-0"><p className="truncate text-sm font-medium">{a.nome}</p><p className="text-xs text-muted">{a.sku} · mínimo {numero(a.estoqueMinimo, 3)}</p></div><Badge tom={a.abaixoDoMinimo ? 'perigo' : 'alerta'}>{numero(a.saldoAtual, 3)} em estoque</Badge></li>))}</ul>
            )}
          </Card>
        )}
      </div>
    </>
  );
}

function Ranking({ titulo, descricao, icone: Icone, linhas, carregando, verMargem }: { titulo: string; descricao: string; icone: typeof Package; linhas?: LinhaProduto[]; carregando: boolean; verMargem: boolean }) {
  return (
    <Card>
      <CardHeader titulo={titulo} descricao={descricao} />
      {carregando ? <CardBody><Skeleton className="h-32 w-full" /></CardBody> : !linhas?.length ? <EmptyState icone={Icone} titulo="Sem dados no período" /> : (
        <ol className="divide-y divide-line">{linhas.map((l, i) => (
          <li key={l.produtoId} className="flex items-center gap-3 px-5 py-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-muted">{i + 1}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{l.nome}</p><p className="text-xs text-muted">{numero(l.quantidade, 3)} un.{verMargem && l.margemPercentual != null ? ` · margem ${percentual(l.margemPercentual)}` : ''}</p></div>
            <span className="num shrink-0 text-sm font-semibold">{brl(l.receita)}</span>
          </li>))}</ol>
      )}
    </Card>
  );
}

function SemIndicadores({ nome }: { nome: string }): ReactNode {
  return <div className="mx-auto max-w-md py-20"><EmptyState icone={Package} titulo={`${saudacao()}${nome ? `, ${nome}` : ''}!`} descricao="Use o menu ao lado para acessar as áreas liberadas para o seu perfil." /></div>;
}
