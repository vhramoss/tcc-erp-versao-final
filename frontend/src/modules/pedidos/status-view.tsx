'use client';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Badge, Button, Card, CardHeader, DataTable, Input, Modal, PageHeader, Switch, toast, type Coluna } from '@/components/ui';
import { useCan } from '@/lib/use-auth';
import { useSalvarStatus, useStatusPedidos, useStatusProdutos } from './api';
import type { StatusPedido, StatusProduto } from './types';

type Alvo = { tipo: 'pedido'; status?: StatusPedido } | { tipo: 'produto'; status?: StatusProduto };

export function StatusView() {
  const { gerenciar } = useCan();
  const podeEditar = gerenciar('pedidos');
  const pedidos = useStatusPedidos(), itens = useStatusProdutos();
  const [alvo, setAlvo] = useState<Alvo | null>(null);
  const salvarPedido = useSalvarStatus('pedido'), salvarItem = useSalvarStatus('produto');

  const alternar = (tipo: 'pedido' | 'produto', id: number, ativo: boolean) =>
    (tipo === 'pedido' ? salvarPedido : salvarItem).mutate({ id, dados: { ativo } }, { onSuccess: () => toast.sucesso(ativo ? 'Status reativado.' : 'Status desativado.') });

  const acoes = <K extends 'pedido' | 'produto'>(tipo: K) => (s: StatusPedido | StatusProduto) => podeEditar ? (
    <div className="flex items-center justify-end gap-3">
      <Switch rotulo="" valor={s.ativo} onChange={(v) => alternar(tipo, s.id, v)} />
      <Button variante="ghost" tamanho="icon" aria-label={`Editar ${s.nome}`} onClick={() => setAlvo(tipo === 'pedido' ? { tipo, status: s as StatusPedido } : { tipo: 'produto', status: s as StatusProduto })}><Pencil className="size-4" /></Button>
    </div>) : null;

  const colunasPedido: Coluna<StatusPedido>[] = [
    { chave: 'o', titulo: 'Ordem', render: (s) => <span className="num text-muted">{s.ordem}</span> },
    { chave: 'n', titulo: 'Status', render: (s) => <span className={s.ativo ? 'font-medium' : 'font-medium text-muted line-through'}>{s.nome}</span> },
    { chave: 'f', titulo: 'Comportamento', render: (s) => <div className="flex flex-wrap gap-1.5">{s.ehInicial && <Badge tom="info">Inicial</Badge>}{s.ehFinal && !s.ehCancelamento && <Badge tom="sucesso">Encerra</Badge>}{s.ehCancelamento && <Badge tom="perigo">Cancela (estorna)</Badge>}{!s.ehInicial && !s.ehFinal && <span className="text-xs text-muted">Etapa intermediária</span>}</div> },
    ...(podeEditar ? [{ chave: 'a', titulo: 'Ativo', alinhar: 'right' as const, render: acoes('pedido') }] : []),
  ];
  const colunasItem: Coluna<StatusProduto>[] = [
    { chave: 'o', titulo: 'Ordem', render: (s) => <span className="num text-muted">{s.ordem}</span> },
    { chave: 'n', titulo: 'Status do item', render: (s) => <span className={s.ativo ? 'font-medium' : 'font-medium text-muted line-through'}>{s.nome}</span> },
    ...(podeEditar ? [{ chave: 'a', titulo: 'Ativo', alinhar: 'right' as const, render: acoes('produto') }] : []),
  ];

  return (
    <>
      <Link href="/pedidos" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" />Pedidos</Link>
      <PageHeader titulo="Status configuráveis" descricao="Defina as etapas do seu fluxo de pedidos. Um status de cancelamento devolve o estoque e cancela o financeiro." />
      <div className="space-y-6">
        <Card>
          <CardHeader titulo="Status do pedido" descricao="Deve existir exatamente um status inicial ativo." acao={podeEditar && <Button tamanho="sm" icone={<Plus className="size-4" />} onClick={() => setAlvo({ tipo: 'pedido' })}>Novo status</Button>} />
          <DataTable colunas={colunasPedido} linhas={[...(pedidos.data ?? [])].sort((a, b) => a.ordem - b.ordem)} chaveLinha={(s) => s.id} carregando={pedidos.isPending} erro={pedidos.error?.message} vazio={{ titulo: 'Nenhum status' }} />
        </Card>
        <Card>
          <CardHeader titulo="Status dos itens" descricao="Acompanhe cada produto do pedido (ex.: pendente, separado, entregue)." acao={podeEditar && <Button tamanho="sm" icone={<Plus className="size-4" />} onClick={() => setAlvo({ tipo: 'produto' })}>Novo status</Button>} />
          <DataTable colunas={colunasItem} linhas={[...(itens.data ?? [])].sort((a, b) => a.ordem - b.ordem)} chaveLinha={(s) => s.id} carregando={itens.isPending} erro={itens.error?.message} vazio={{ titulo: 'Nenhum status' }} />
        </Card>
      </div>
      {alvo && <StatusFormModal alvo={alvo} onFechar={() => setAlvo(null)} salvar={alvo.tipo === 'pedido' ? salvarPedido.mutateAsync : salvarItem.mutateAsync} />}
    </>
  );
}

function StatusFormModal({ alvo, onFechar, salvar }: { alvo: Alvo; onFechar: () => void; salvar: (v: { id?: number; dados: Record<string, unknown> }) => Promise<unknown> }) {
  const edicao = !!alvo.status;
  const [nome, setNome] = useState('');
  const [ordem, setOrdem] = useState('0');
  const [inicial, setInicial] = useState(false);
  const [final, setFinal] = useState(false);
  const [cancela, setCancela] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { setNome(alvo.status?.nome ?? ''); setOrdem(String(alvo.status?.ordem ?? 0)); }, [alvo]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return toast.erro('Informe o nome do status.');
    const dados: Record<string, unknown> = { nome: nome.trim(), ordem: Number.parseInt(ordem, 10) || 0 };
    if (!edicao && alvo.tipo === 'pedido') Object.assign(dados, { ehInicial: inicial, ehFinal: final || cancela, ehCancelamento: cancela });
    setEnviando(true);
    try { await salvar({ id: alvo.status?.id, dados }); toast.sucesso(edicao ? 'Status atualizado.' : 'Status criado.'); onFechar(); } catch { /* aviso já exibido */ } finally { setEnviando(false); }
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={edicao ? 'Editar status' : 'Novo status'} descricao={edicao && alvo.tipo === 'pedido' ? 'O comportamento (inicial, encerra, cancela) não muda depois de criado, para não alterar pedidos já gravados.' : undefined}
      rodape={<><Button variante="outline" onClick={onFechar} disabled={enviando}>Cancelar</Button><Button type="submit" form="form-status" carregando={enviando}>Salvar</Button></>}>
      <form id="form-status" onSubmit={enviar} className="space-y-4" noValidate>
        <Input rotulo="Nome" obrigatorio value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
        <Input rotulo="Ordem no fluxo" type="number" min={0} value={ordem} onChange={(e) => setOrdem(e.target.value)} />
        {!edicao && alvo.tipo === 'pedido' && (
          <div className="space-y-3 rounded-xl border border-line p-3.5">
            <Switch rotulo="Status inicial" descricao="Atribuído a todo pedido novo. Só um por empresa: este substitui o atual." valor={inicial} onChange={setInicial} />
            <Switch rotulo="Encerra o pedido" descricao="Depois dele o pedido não muda mais." valor={final || cancela} onChange={setFinal} disabled={cancela} />
            <Switch rotulo="Cancela o pedido" descricao="Devolve o estoque e cancela a conta a receber." valor={cancela} onChange={setCancela} />
          </div>
        )}
      </form>
    </Modal>
  );
}
