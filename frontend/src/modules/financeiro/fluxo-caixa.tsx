'use client';
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Scale, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardBody, CardHeader, Input, StatCard } from '@/components/ui';
import { cn } from '@/lib/cn';
import { brl, dataBR, fimDoMes, hojeISO, inicioDoMes, somarDias } from '@/lib/format';
import { useFluxoCaixa } from './api';

const PRESETS = [
  { chave: 'mes', rotulo: 'Este mês', faixa: () => [inicioDoMes(hojeISO()), fimDoMes(hojeISO())] },
  { chave: 'prox30', rotulo: 'Próximos 30 dias', faixa: () => [hojeISO(), somarDias(hojeISO(), 30)] },
  { chave: 'ult30', rotulo: 'Últimos 30 dias', faixa: () => [somarDias(hojeISO(), -30), hojeISO()] },
  { chave: 'personalizado', rotulo: 'Personalizado', faixa: () => [inicioDoMes(hojeISO()), fimDoMes(hojeISO())] },
] as const;

export function FluxoCaixaView() {
  const [preset, setPreset] = useState<(typeof PRESETS)[number]['chave']>('mes');
  const [inicio, setInicio] = useState(() => inicioDoMes(hojeISO()));
  const [fim, setFim] = useState(() => fimDoMes(hojeISO()));
  const q = useFluxoCaixa(inicio, fim);
  const f = q.data;

  const escolher = (chave: (typeof PRESETS)[number]['chave']) => {
    setPreset(chave);
    const p = PRESETS.find((x) => x.chave === chave)!;
    if (chave !== 'personalizado') { const [a, b] = p.faixa(); setInicio(a); setFim(b); }
  };

  const dados = useMemo(() => (f ? [
    { nome: 'Realizado', Receitas: f.realizado.totalReceitas, Despesas: f.realizado.totalDespesas },
    { nome: 'Previsto', Receitas: f.previsto.totalReceitas, Despesas: f.previsto.totalDespesas },
  ] : []), [f]);

  const atraso = f ? f.emAtraso.totalReceitas + f.emAtraso.totalDespesas : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-wrap items-end gap-4">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Período">
            {PRESETS.map((p) => (
              <button key={p.chave} type="button" onClick={() => escolher(p.chave)} aria-pressed={preset === p.chave}
                className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition', preset === p.chave ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:bg-surface-2')}>{p.rotulo}</button>
            ))}
          </div>
          {preset === 'personalizado' && (
            <div className="flex flex-wrap items-end gap-3">
              <Input rotulo="De" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
              <Input rotulo="Até" type="date" value={fim} onChange={(e) => setFim(e.target.value)} erro={inicio > fim ? 'Fim antes do início.' : undefined} />
            </div>
          )}
          <p className="ml-auto text-xs text-muted">{dataBR(inicio)} a {dataBR(fim)}</p>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Saldo realizado" valor={brl(f?.realizado.saldoLiquido)} detalhe={f && `${brl(f.realizado.totalReceitas)} entrou · ${brl(f.realizado.totalDespesas)} saiu`} icone={Scale} tom={f && f.realizado.saldoLiquido < 0 ? 'perigo' : 'sucesso'} carregando={q.isPending} />
        <StatCard titulo="A receber" valor={brl(f?.previsto.totalReceitas)} detalhe="Pendente no período" icone={ArrowDownCircle} tom="info" carregando={q.isPending} />
        <StatCard titulo="A pagar" valor={brl(f?.previsto.totalDespesas)} detalhe="Pendente no período" icone={ArrowUpCircle} tom="alerta" carregando={q.isPending} />
        <StatCard titulo="Saldo projetado" valor={brl(f?.saldoProjetado)} detalhe="Realizado + previsto" icone={TrendingUp} tom={f && f.saldoProjetado < 0 ? 'perigo' : 'marca'} carregando={q.isPending} destaque />
      </div>

      {f && atraso > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p><strong>Contas vencidas em aberto:</strong> {brl(f.emAtraso.totalReceitas)} a receber e {brl(f.emAtraso.totalDespesas)} a pagar (qualquer período, vencidas antes de hoje).</p>
        </div>
      )}

      <Card>
        <CardHeader titulo="Entradas e saídas" descricao="Realizado = já liquidado no período. Previsto = pendente com vencimento no período." />
        <CardBody>
          {q.error ? <p className="py-10 text-center text-sm text-danger">{q.error.message}</p> : q.isPending ? <div className="h-72 animate-pulse rounded-xl bg-surface-2" /> : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados} barGap={8} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(var(--line))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nome" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted))', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} width={64} tick={{ fill: 'hsl(var(--muted))', fontSize: 12 }} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)} mil` : String(v))} />
                  <Tooltip cursor={{ fill: 'hsl(var(--surface-2))' }} formatter={(v) => brl(v)} contentStyle={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--line))', borderRadius: 12, fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Receitas" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} maxBarSize={72} />
                  <Bar dataKey="Despesas" fill="hsl(var(--danger))" radius={[6, 6, 0, 0]} maxBarSize={72} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
