'use client';
import { Ban, CheckCircle2, ExternalLink, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { StatusFinanceiroBadge } from '@/components/domain/status-badges';
import { Badge, Button, Card, ConfirmDialog, DataTable, Input, PageHeader, Pagination, Select, Tabs, toast, useAba, type Coluna } from '@/components/ui';
import { brl, dataBR } from '@/lib/format';
import { useCan } from '@/lib/use-auth';
import { useCancelarTransacao, useDarBaixa, useTransacoes } from './api';
import { FluxoCaixaView } from './fluxo-caixa';
import { LancamentoFormModal } from './lancamento-form';
import { Tesouraria } from './tesouraria';
import type { StatusTransacao, TipoTransacao, Transacao } from './types';

const ABAS = ['lancamentos', 'fluxo', 'tesouraria'];
const LIMITE = 15;

export function FinanceiroView() {
  const { gerenciar } = useCan();
  const podeEditar = gerenciar('financeiro');
  const [aba, setAba] = useAba('lancamentos', ABAS);
  const [novo, setNovo] = useState(false);

  return (
    <>
      <PageHeader titulo="Financeiro" descricao="Contas a pagar e a receber, fluxo de caixa e cadastros de tesouraria."
        acoes={podeEditar && aba === 'lancamentos' && <Button icone={<Plus className="size-4" />} onClick={() => setNovo(true)}>Novo lançamento</Button>} />
      <Tabs ativa={aba} onChange={setAba} abas={[{ chave: 'lancamentos', rotulo: 'Lançamentos' }, { chave: 'fluxo', rotulo: 'Fluxo de caixa' }, { chave: 'tesouraria', rotulo: 'Tesouraria' }]} />
      {aba === 'lancamentos' && <Lancamentos podeEditar={podeEditar} />}
      {aba === 'fluxo' && <FluxoCaixaView />}
      {aba === 'tesouraria' && <Tesouraria />}
      <LancamentoFormModal aberto={novo} onFechar={() => setNovo(false)} />
    </>
  );
}

function Lancamentos({ podeEditar }: { podeEditar: boolean }) {
  const [tipo, setTipo] = useState<TipoTransacao | ''>('');
  const [status, setStatus] = useState<StatusTransacao | ''>('');
  const [dataInicio, setInicio] = useState('');
  const [dataFim, setFim] = useState('');
  const [page, setPage] = useState(1);
  const [acao, setAcao] = useState<{ tipo: 'baixa' | 'cancelar'; t: Transacao } | null>(null);
  const invertido = !!dataInicio && !!dataFim && dataInicio > dataFim;
  const q = useTransacoes({ tipo: tipo || undefined, status: status || undefined, dataInicio: dataInicio || undefined, dataFim: dataFim || undefined, page, limit: LIMITE });
  const baixa = useDarBaixa(), cancelar = useCancelarTransacao();

  const colunas: Coluna<Transacao>[] = [
    { chave: 'v', titulo: 'Vencimento', render: (t) => <span className="num whitespace-nowrap">{dataBR(t.dataVencimento)}</span> },
    { chave: 'd', titulo: 'Descrição', render: (t) => (
      <div className="min-w-0 max-w-[22rem]"><p className="truncate font-medium">{t.descricao}</p>
        <p className="truncate text-xs text-muted">{[t.planoContas && `${t.planoContas.codigo} ${t.planoContas.nome}`, t.centroCusto?.nome, t.formaPagamento?.nome].filter(Boolean).join(' · ') || 'Sem classificação'}</p></div>) },
    { chave: 'o', titulo: 'Origem', ocultarAte: 'md', render: (t) => t.pedidoId ? <Link href={`/pedidos/${t.pedidoId}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline" onClick={(e) => e.stopPropagation()}>Pedido<ExternalLink className="size-3" /></Link> : t.compraId ? <Badge tom="marca">Compra</Badge> : <Badge>Manual</Badge> },
    { chave: 'val', titulo: 'Valor', alinhar: 'right', render: (t) => <span className={t.tipo === 'RECEITA' ? 'num font-semibold text-success' : 'num font-semibold text-danger'}>{t.tipo === 'RECEITA' ? '+' : '−'}{brl(t.valor)}</span> },
    { chave: 's', titulo: 'Situação', render: (t) => <StatusFinanceiroBadge status={t.status} tipo={t.tipo} atrasado={t.atrasado} /> },
    ...(podeEditar ? [{ chave: 'a', titulo: '', alinhar: 'right' as const, render: (t: Transacao) => t.status !== 'PENDENTE' ? null : (
      <div className="flex justify-end gap-1">
        <Button variante="ghost" tamanho="sm" icone={<CheckCircle2 className="size-4" />} onClick={() => setAcao({ tipo: 'baixa', t })}>{t.tipo === 'RECEITA' ? 'Receber' : 'Pagar'}</Button>
        {!t.pedidoId && !t.compraId && <Button variante="ghost" tamanho="icon" aria-label="Cancelar lançamento" onClick={() => setAcao({ tipo: 'cancelar', t })}><Ban className="size-4 text-danger" /></Button>}
      </div>) }] : []),
  ];

  async function confirmar() {
    if (!acao) return;
    try {
      if (acao.tipo === 'baixa') { await baixa.mutateAsync(acao.t.id); toast.sucesso(acao.t.tipo === 'RECEITA' ? 'Recebimento registrado.' : 'Pagamento registrado.'); }
      else { await cancelar.mutateAsync(acao.t.id); toast.sucesso('Lançamento cancelado.'); }
    } catch { /* aviso já exibido */ }
    setAcao(null);
  }

  return (
    <Card>
      <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select aria-label="Tipo" value={tipo} onChange={(e) => { setTipo(e.target.value as TipoTransacao | ''); setPage(1); }}><option value="">Receitas e despesas</option><option value="RECEITA">Só receitas</option><option value="DESPESA">Só despesas</option></Select>
        <Select aria-label="Situação" value={status} onChange={(e) => { setStatus(e.target.value as StatusTransacao | ''); setPage(1); }}><option value="">Todas as situações</option><option value="PENDENTE">Pendentes</option><option value="PAGO">Pagos / recebidos</option><option value="CANCELADO">Cancelados</option></Select>
        <Input aria-label="Vencimento de" type="date" value={dataInicio} onChange={(e) => { setInicio(e.target.value); setPage(1); }} erro={invertido ? 'Início depois do fim.' : undefined} />
        <Input aria-label="Vencimento até" type="date" value={dataFim} onChange={(e) => { setFim(e.target.value); setPage(1); }} />
      </div>
      <DataTable colunas={colunas} linhas={invertido ? [] : q.data?.items} chaveLinha={(t) => t.id} carregando={q.isPending && !invertido} erro={q.error?.message} onRetry={() => q.refetch()} vazio={{ titulo: 'Nenhum lançamento', descricao: 'Ajuste os filtros ou crie um lançamento.' }} />
      {q.data && !invertido && <Pagination page={q.data.page} limit={q.data.limit} total={q.data.total} onPage={setPage} />}
      <ConfirmDialog aberto={!!acao} onFechar={() => setAcao(null)} onConfirmar={confirmar} carregando={baixa.isPending || cancelar.isPending} perigo={acao?.tipo === 'cancelar'}
        titulo={acao?.tipo === 'baixa' ? (acao.t.tipo === 'RECEITA' ? 'Registrar recebimento' : 'Registrar pagamento') : 'Cancelar lançamento'} confirmar={acao?.tipo === 'baixa' ? 'Confirmar' : 'Cancelar lançamento'}
        mensagem={acao ? <><strong className="text-fg">{acao.t.descricao}</strong> · {brl(acao.t.valor)}. {acao.tipo === 'baixa' ? 'A data de hoje será registrada como data de liquidação.' : 'Esta ação não pode ser desfeita.'}</> : null} />
    </Card>
  );
}
