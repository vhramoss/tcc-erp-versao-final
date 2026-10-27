'use client';
import { Plus, Settings2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StatusFinanceiroBadge, StatusPedidoBadge } from '@/components/domain/status-badges';
import { Button, Card, DataTable, Input, PageHeader, Pagination, SearchSelect, Select, type Coluna } from '@/components/ui';
import { brl, dataBR } from '@/lib/format';
import { useCan } from '@/lib/use-auth';
import { useClientes } from '@/modules/clientes/api';
import { usePedidos, useStatusPedidos } from './api';
import type { Pedido } from './types';

const LIMITE = 15;

export function PedidosView() {
  const router = useRouter();
  const { gerenciar, ler } = useCan();
  const [statusId, setStatusId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [dataInicio, setInicio] = useState('');
  const [dataFim, setFim] = useState('');
  const [page, setPage] = useState(1);

  const status = useStatusPedidos();
  const clientes = useClientes(ler('clientes'));
  const q = usePedidos({ statusId: Number(statusId) || undefined, clienteId: Number(clienteId) || undefined, dataInicio: dataInicio || undefined, dataFim: dataFim || undefined, page, limit: LIMITE });
  const filtrando = !!(statusId || clienteId || dataInicio || dataFim);
  const invertido = !!dataInicio && !!dataFim && dataInicio > dataFim;

  const colunas: Coluna<Pedido>[] = [
    { chave: 'r', titulo: 'Pedido', render: (p) => <div className="min-w-0"><p className="max-w-[14rem] truncate font-medium">{p.referencia}</p><p className="text-xs text-muted">{dataBR(p.dataPedido)}</p></div> },
    { chave: 'c', titulo: 'Cliente', render: (p) => <span className="block max-w-[16rem] truncate">{p.cliente.pessoa.nome}</span> },
    { chave: 'v', titulo: 'Total', alinhar: 'right', render: (p) => <span className="num font-semibold">{brl(p.valorTotal)}</span> },
    { chave: 's', titulo: 'Status', render: (p) => <StatusPedidoBadge status={p.status} /> },
    { chave: 'f', titulo: 'Pagamento', ocultarAte: 'md', render: (p) => (p.financeiro ? <div className="flex flex-col items-start gap-0.5"><StatusFinanceiroBadge status={p.financeiro.status} tipo="RECEITA" vencimento={p.financeiro.dataVencimento} /><span className="text-xs text-muted">vence {dataBR(p.financeiro.dataVencimento)}</span></div> : <span className="text-muted">—</span>) },
  ];

  return (
    <>
      <PageHeader titulo="Pedidos" descricao="Cada pedido baixa o estoque e gera a conta a receber automaticamente."
        acoes={<>
          {gerenciar('pedidos') && <Link href="/pedidos/status"><Button variante="outline" icone={<Settings2 className="size-4" />}>Configurar status</Button></Link>}
          {gerenciar('pedidos') && <Link href="/pedidos/nova"><Button icone={<Plus className="size-4" />}>Novo pedido</Button></Link>}
        </>} />
      <Card>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select aria-label="Status" value={statusId} onChange={(e) => { setStatusId(e.target.value); setPage(1); }}>
            <option value="">Todos os status</option>{status.data?.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </Select>
          {ler('clientes') && <SearchSelect opcoes={[{ valor: '', rotulo: 'Todos os clientes' }, ...(clientes.data ?? []).map((c) => ({ valor: c.id, rotulo: c.pessoa.nome }))]} valor={clienteId} onChange={(v) => { setClienteId(v); setPage(1); }} carregando={clientes.isPending} placeholder="Todos os clientes" />}
          <Input aria-label="Data inicial" type="date" value={dataInicio} onChange={(e) => { setInicio(e.target.value); setPage(1); }} erro={invertido ? 'Início depois do fim.' : undefined} />
          <Input aria-label="Data final" type="date" value={dataFim} onChange={(e) => { setFim(e.target.value); setPage(1); }} />
        </div>
        <DataTable colunas={colunas} linhas={invertido ? [] : q.data?.items} chaveLinha={(p) => p.id} carregando={q.isPending && !invertido} erro={q.error?.message} onRetry={() => q.refetch()} aoClicar={(p) => router.push(`/pedidos/${p.id}`)}
          vazio={{ titulo: filtrando ? 'Nenhum pedido com esses filtros' : 'Nenhum pedido ainda', descricao: filtrando ? 'Ajuste ou limpe os filtros.' : 'Registre o primeiro pedido: o estoque e o financeiro são atualizados sozinhos.', acao: !filtrando && gerenciar('pedidos') ? <Link href="/pedidos/nova"><Button icone={<ShoppingCart className="size-4" />}>Novo pedido</Button></Link> : undefined }} />
        {q.data && !invertido && <Pagination page={q.data.page} limit={q.data.limit} total={q.data.total} onPage={setPage} />}
      </Card>
    </>
  );
}
