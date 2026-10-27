'use client';
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PessoaFormModal } from '@/components/domain/pessoa-form';
import { Badge, Button, Card, ConfirmDialog, DataTable, Input, PageHeader, toast, type Coluna } from '@/components/ui';
import { mascaraDocumento, normalizar } from '@/lib/format';
import { useCan } from '@/lib/use-auth';
import { useClientes, useExcluirCliente, useSalvarCliente } from './api';
import type { Cliente } from './types';

export function ClientesView() {
  const { gerenciar } = useCan();
  const podeEditar = gerenciar('clientes');
  const clientes = useClientes();
  const salvar = useSalvarCliente();
  const excluir = useExcluirCliente();
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<Cliente | 'novo' | null>(null);
  const [removendo, setRemovendo] = useState<Cliente | null>(null);

  const filtrados = useMemo(() => {
    const t = normalizar(busca.trim());
    return (clientes.data ?? []).filter((c) => !t || normalizar(`${c.pessoa.nome} ${c.pessoa.email} ${c.pessoa.cpfCnpj} ${c.pessoa.telefone ?? ''}`).includes(t));
  }, [clientes.data, busca]);

  const colunas: Coluna<Cliente>[] = [
    { chave: 'n', titulo: 'Cliente', render: (c) => <div className="min-w-0"><p className="truncate font-medium">{c.pessoa.nome}</p><p className="truncate text-xs text-muted">{c.pessoa.email}</p></div> },
    { chave: 'd', titulo: 'Documento', ocultarAte: 'sm', render: (c) => <span className="num text-muted">{mascaraDocumento(c.pessoa.cpfCnpj)}</span> },
    { chave: 't', titulo: 'Tipo', ocultarAte: 'md', render: (c) => <Badge>{c.pessoa.tipo === 'FISICA' ? 'Pessoa física' : 'Pessoa jurídica'}</Badge> },
    { chave: 'f', titulo: 'Telefone', ocultarAte: 'lg', render: (c) => <span className="text-muted">{c.pessoa.telefone || '—'}</span> },
    ...(podeEditar ? [{ chave: 'a', titulo: '', alinhar: 'right' as const, render: (c: Cliente) => (
      <div className="flex justify-end gap-1">
        <Button variante="ghost" tamanho="icon" aria-label={`Editar ${c.pessoa.nome}`} onClick={() => setEditando(c)}><Pencil className="size-4" /></Button>
        <Button variante="ghost" tamanho="icon" aria-label={`Excluir ${c.pessoa.nome}`} onClick={() => setRemovendo(c)}><Trash2 className="size-4 text-danger" /></Button>
      </div>) }] : []),
  ];

  return (
    <>
      <PageHeader titulo="Clientes" descricao="Histórico e dados de contato de quem compra de você." acoes={podeEditar && <Button icone={<Plus className="size-4" />} onClick={() => setEditando('novo')}>Novo cliente</Button>} />
      <Card>
        <div className="border-b border-line p-4"><div className="relative max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input aria-label="Buscar clientes" placeholder="Buscar por nome, e-mail ou documento…" value={busca} onChange={(e) => setBusca(e.target.value)} className="[&_input]:pl-9" /></div></div>
        <DataTable colunas={colunas} linhas={filtrados} chaveLinha={(c) => c.id} carregando={clientes.isPending} erro={clientes.error?.message} onRetry={() => clientes.refetch()}
          vazio={{ titulo: busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado', descricao: busca ? 'Tente outro termo.' : 'Cadastre clientes para vincular aos pedidos.', acao: !busca && podeEditar ? <Button icone={<Users className="size-4" />} onClick={() => setEditando('novo')}>Cadastrar cliente</Button> : undefined }} />
      </Card>

      <PessoaFormModal aberto={!!editando} onFechar={() => setEditando(null)} titulo={editando === 'novo' ? 'Novo cliente' : 'Editar cliente'} inicial={editando && editando !== 'novo' ? editando.pessoa : undefined}
        rotuloSalvar={editando === 'novo' ? 'Cadastrar' : 'Salvar alterações'}
        onSalvar={async (dados) => { await salvar.mutateAsync({ id: editando && editando !== 'novo' ? editando.id : undefined, dados }); toast.sucesso(editando === 'novo' ? 'Cliente cadastrado.' : 'Cliente atualizado.'); }} />
      <ConfirmDialog aberto={!!removendo} onFechar={() => setRemovendo(null)} perigo confirmar="Excluir" titulo="Excluir cliente" carregando={excluir.isPending}
        mensagem={<>Excluir <strong className="text-fg">{removendo?.pessoa.nome}</strong>? Clientes com pedidos não podem ser excluídos.</>}
        onConfirmar={async () => { if (!removendo) return; try { await excluir.mutateAsync(removendo.id); toast.sucesso('Cliente excluído.'); setRemovendo(null); } catch { setRemovendo(null); } }} />
    </>
  );
}
