'use client';
import { AlertTriangle, ArrowRightLeft, Plus, Search, Warehouse } from 'lucide-react';
import { useState } from 'react';
import { FormModal } from '@/components/domain/form-modal';
import { Badge, Button, Card, DataTable, EmptyState, Input, PageHeader, Pagination, SearchSelect, Select, Tabs, toast, useAba, type Coluna } from '@/components/ui';
import { dataHoraBR, numero, paraNumero } from '@/lib/format';
import { useDebounce } from '@/lib/use-debounce';
import { useCan } from '@/lib/use-auth';
import { useProdutos } from '@/modules/produtos/api';
import { useAlertas, useAlmoxarifados, useCriarAlmoxarifado, useMovimentos, useSaldos } from './api';
import { MovimentacaoModal } from './movimentacao-modal';
import type { AlertaEstoque, Almoxarifado, Movimento, SaldoProduto } from './types';

const ABAS = ['saldos', 'historico', 'alertas', 'almoxarifados'];
const LIMITE = 15;

export function EstoqueView() {
  const { gerenciar } = useCan();
  const podeEditar = gerenciar('estoque');
  const [aba, setAba] = useAba('saldos', ABAS);
  const [movimentando, setMovimentando] = useState<{ produtoId?: number } | null>(null);
  const [novoAlmox, setNovoAlmox] = useState(false);
  const alertas = useAlertas();
  const almox = useAlmoxarifados();
  const criarAlmox = useCriarAlmoxarifado();

  return (
    <>
      <PageHeader titulo="Estoque" descricao="Saldos por produto e almoxarifado, histórico de movimentações e alertas de reposição."
        acoes={podeEditar && <Button icone={<ArrowRightLeft className="size-4" />} onClick={() => setMovimentando({})}>Movimentar</Button>} />
      <Tabs ativa={aba} onChange={setAba} abas={[
        { chave: 'saldos', rotulo: 'Saldos' },
        { chave: 'historico', rotulo: 'Histórico' },
        { chave: 'alertas', rotulo: 'Alertas de reposição', contagem: alertas.data?.length },
        { chave: 'almoxarifados', rotulo: 'Almoxarifados', contagem: almox.data?.length },
      ]} />

      {aba === 'saldos' && <Saldos podeMovimentar={podeEditar} onMovimentar={(produtoId) => setMovimentando({ produtoId })} />}
      {aba === 'historico' && <Historico />}
      {aba === 'alertas' && <Alertas lista={alertas.data} carregando={alertas.isPending} erro={alertas.error?.message} podeMovimentar={podeEditar} onMovimentar={(produtoId) => setMovimentando({ produtoId })} />}
      {aba === 'almoxarifados' && (
        <Card>
          <div className="flex items-center justify-between border-b border-line p-4">
            <p className="text-sm text-muted">Locais onde o estoque é guardado. Cada pedido baixa de um almoxarifado.</p>
            {podeEditar && <Button tamanho="sm" icone={<Plus className="size-4" />} onClick={() => setNovoAlmox(true)}>Novo almoxarifado</Button>}
          </div>
          <DataTable<Almoxarifado> colunas={[
            { chave: 'n', titulo: 'Nome', render: (a) => <span className="flex items-center gap-2 font-medium"><Warehouse className="size-4 text-muted" />{a.nome}</span> },
            { chave: 's', titulo: 'Situação', render: (a) => (a.ativo ? <Badge tom="sucesso">Ativo</Badge> : <Badge>Inativo</Badge>) },
          ]} linhas={almox.data} chaveLinha={(a) => a.id} carregando={almox.isPending} erro={almox.error?.message} vazio={{ titulo: 'Nenhum almoxarifado', descricao: 'Crie um almoxarifado para registrar entradas e vender.' }} />
        </Card>
      )}

      <MovimentacaoModal aberto={!!movimentando} produtoInicial={movimentando?.produtoId} onFechar={() => setMovimentando(null)} />
      <FormModal aberto={novoAlmox} onFechar={() => setNovoAlmox(false)} titulo="Novo almoxarifado" rotuloSalvar="Criar"
        campos={[{ chave: 'nome', rotulo: 'Nome', placeholder: 'Ex.: Depósito Central', obrigatorio: true }]}
        onSubmit={async (v) => { await criarAlmox.mutateAsync({ nome: v.nome }); toast.sucesso('Almoxarifado criado.'); }} />
    </>
  );
}

function Saldos({ podeMovimentar, onMovimentar }: { podeMovimentar: boolean; onMovimentar: (produtoId: number) => void }) {
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState(1);
  const termo = useDebounce(busca.trim(), 300);
  const q = useSaldos({ busca: termo || undefined, page, limit: LIMITE });

  const colunas: Coluna<SaldoProduto>[] = [
    { chave: 'p', titulo: 'Produto', render: (s) => <div className="min-w-0"><p className="truncate font-medium">{s.nome}</p><p className="text-xs text-muted">{s.sku}</p></div> },
    { chave: 't', titulo: 'Saldo total', alinhar: 'right', render: (s) => <span className="num font-semibold">{numero(s.saldoTotal, 3)} <span className="text-xs font-normal text-muted">{s.unidade}</span></span> },
    { chave: 'm', titulo: 'Mínimo', alinhar: 'right', ocultarAte: 'sm', render: (s) => <span className="num text-muted">{numero(s.estoqueMinimo, 3)}</span> },
    { chave: 's', titulo: 'Situação', render: (s) => (!s.alertaEstoqueAtivo ? <Badge>Sem alerta</Badge> : s.noMinimoOuAbaixo ? <Badge tom="perigo"><AlertTriangle className="size-3" />Repor</Badge> : <Badge tom="sucesso">Normal</Badge>) },
    { chave: 'a', titulo: 'Por almoxarifado', ocultarAte: 'lg', render: (s) => s.almoxarifados.length ? <div className="flex flex-wrap gap-1.5">{s.almoxarifados.map((a) => <span key={a.almoxarifadoId} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">{a.almoxarifado}: <b className="num font-medium text-fg">{numero(a.quantidade, 3)}</b></span>)}</div> : <span className="text-xs text-muted">Sem movimentação</span> },
    ...(podeMovimentar ? [{ chave: 'x', titulo: '', alinhar: 'right' as const, render: (s: SaldoProduto) => <Button variante="ghost" tamanho="sm" onClick={() => onMovimentar(s.produtoId)}>Movimentar</Button> }] : []),
  ];

  return (
    <Card>
      <div className="border-b border-line p-4"><div className="relative max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input aria-label="Buscar produto" placeholder="Buscar por nome ou SKU…" value={busca} onChange={(e) => { setBusca(e.target.value); setPage(1); }} className="[&_input]:pl-9" /></div></div>
      <DataTable colunas={colunas} linhas={q.data?.items} chaveLinha={(s) => s.produtoId} carregando={q.isPending} erro={q.error?.message} onRetry={() => q.refetch()}
        vazio={{ titulo: termo ? 'Nenhum produto encontrado' : 'Sem produtos cadastrados', descricao: termo ? 'Tente outro termo.' : 'Cadastre produtos para acompanhar o saldo aqui.' }} />
      {q.data && <Pagination page={q.data.page} limit={q.data.limit} total={q.data.total} onPage={setPage} />}
    </Card>
  );
}

function Historico() {
  const [produtoId, setProdutoId] = useState('');
  const [almoxarifadoId, setAlmox] = useState('');
  const [page, setPage] = useState(1);
  const produtos = useProdutos();
  const almox = useAlmoxarifados();
  const q = useMovimentos({ produtoId: Number(produtoId) || undefined, almoxarifadoId: Number(almoxarifadoId) || undefined, page, limit: LIMITE });

  const colunas: Coluna<Movimento>[] = [
    { chave: 'd', titulo: 'Data', render: (m) => <span className="num whitespace-nowrap text-muted">{dataHoraBR(m.createdAt)}</span> },
    { chave: 'p', titulo: 'Produto', render: (m) => <div className="min-w-0"><p className="truncate font-medium">{m.estoque.produto.nome}</p><p className="text-xs text-muted">{m.estoque.almoxarifado.nome}</p></div> },
    { chave: 't', titulo: 'Tipo', render: (m) => (m.tipo === 'ENTRADA' ? <Badge tom="sucesso">Entrada</Badge> : <Badge tom="alerta">Saída</Badge>) },
    { chave: 'q', titulo: 'Quantidade', alinhar: 'right', render: (m) => <span className={m.tipo === 'ENTRADA' ? 'num font-medium text-success' : 'num font-medium text-warning'}>{m.tipo === 'ENTRADA' ? '+' : '−'}{numero(m.qtdModificada, 3)}</span> },
    { chave: 's', titulo: 'Saldo', alinhar: 'right', ocultarAte: 'sm', render: (m) => <span className="num text-xs text-muted">{numero(paraNumero(m.qtdAnterior), 3)} → <b className="font-medium text-fg">{numero(paraNumero(m.qtdPosterior), 3)}</b></span> },
    { chave: 'o', titulo: 'Origem', ocultarAte: 'md', render: (m) => <div className="max-w-[16rem]"><Badge tom={m.pedidoId ? 'info' : m.compraId ? 'marca' : 'neutro'}>{m.pedidoId ? 'Pedido' : m.compraId ? 'Compra' : 'Manual'}</Badge><p className="mt-0.5 truncate text-xs text-muted" title={m.observacao}>{m.observacao}</p></div> },
    { chave: 'u', titulo: 'Usuário', ocultarAte: 'lg', render: (m) => <span className="text-muted">{m.usuario.username}</span> },
  ];

  return (
    <Card>
      <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:max-w-2xl">
        <SearchSelect opcoes={[{ valor: '', rotulo: 'Todos os produtos' }, ...(produtos.data ?? []).map((p) => ({ valor: p.id, rotulo: p.nome, detalhe: p.sku }))]} valor={produtoId} onChange={(v) => { setProdutoId(v); setPage(1); }} placeholder="Todos os produtos" carregando={produtos.isPending} />
        <Select aria-label="Almoxarifado" value={almoxarifadoId} onChange={(e) => { setAlmox(e.target.value); setPage(1); }}>
          <option value="">Todos os almoxarifados</option>{almox.data?.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </Select>
      </div>
      <DataTable colunas={colunas} linhas={q.data?.items} chaveLinha={(m) => m.id} carregando={q.isPending} erro={q.error?.message} onRetry={() => q.refetch()} vazio={{ titulo: 'Nenhuma movimentação', descricao: 'Entradas, saídas e estornos aparecem aqui.' }} />
      {q.data && <Pagination page={q.data.page} limit={q.data.limit} total={q.data.total} onPage={setPage} />}
    </Card>
  );
}

function Alertas({ lista, carregando, erro, podeMovimentar, onMovimentar }: { lista?: AlertaEstoque[]; carregando: boolean; erro?: string; podeMovimentar: boolean; onMovimentar: (id: number) => void }) {
  if (!carregando && !erro && lista?.length === 0) return <Card><EmptyState icone={AlertTriangle} titulo="Tudo certo por aqui" descricao="Nenhum produto atingiu o estoque mínimo configurado." /></Card>;
  return (
    <Card>
      <DataTable<AlertaEstoque> colunas={[
        { chave: 'p', titulo: 'Produto', render: (a) => <div><p className="font-medium">{a.nome}</p><p className="text-xs text-muted">{a.sku}</p></div> },
        { chave: 's', titulo: 'Saldo atual', alinhar: 'right', render: (a) => <span className="num font-semibold text-danger">{numero(a.saldoAtual, 3)}</span> },
        { chave: 'm', titulo: 'Mínimo', alinhar: 'right', render: (a) => <span className="num text-muted">{numero(a.estoqueMinimo, 3)}</span> },
        { chave: 'k', titulo: 'Situação', render: (a) => (a.abaixoDoMinimo ? <Badge tom="perigo">Abaixo do mínimo</Badge> : <Badge tom="alerta">No mínimo</Badge>) },
        ...(podeMovimentar ? [{ chave: 'x', titulo: '', alinhar: 'right' as const, render: (a: AlertaEstoque) => <Button variante="outline" tamanho="sm" onClick={() => onMovimentar(a.produtoId)}>Repor</Button> }] : []),
      ]} linhas={lista} chaveLinha={(a) => a.produtoId} carregando={carregando} erro={erro} />
    </Card>
  );
}
