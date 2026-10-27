'use client';
import { Plus, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormModal } from '@/components/domain/form-modal';
import { Badge, Button, Card, DataTable, Modal, PageHeader, Select, Switch, Tabs, toast, useAba, type Coluna } from '@/components/ui';
import { ROTULO_RECURSO, type Recurso } from '@/lib/permissoes';
import { useCan } from '@/lib/use-auth';
import { useAtualizarUsuario, useCatalogo, useCriarDepartamento, useDefinirPermissoesDepartamento, useDefinirPermissoesUsuario, useDepartamentos, useUsuarios } from './api';
import { PermissoesMatriz } from './permissoes-matriz';
import { UsuarioFormModal } from './usuario-form';
import { nomesDe, type DepartamentoAcesso, type UsuarioAcesso } from './types';

const ABAS = ['usuarios', 'departamentos'];

/** Resumo legível: "Pedidos (ver e alterar), Estoque (ver)". */
function resumo(nomes: string[]) {
  const por = new Map<string, string[]>();
  for (const n of nomes) { const [r, nivel] = n.split('.'); por.set(r, [...(por.get(r) ?? []), nivel]); }
  return [...por].map(([r, n]) => `${ROTULO_RECURSO[r as Recurso] ?? r} (${n.includes('gerenciar') ? 'ver e alterar' : 'ver'})`);
}

export function AcessosView() {
  const { me, gerenciar } = useCan();
  const podeEditar = gerenciar('acessos');
  const [aba, setAba] = useAba('usuarios', ABAS);
  const [novoUsuario, setNovoUsuario] = useState(false);
  const [novoDep, setNovoDep] = useState(false);
  const [editaUsuario, setEditaUsuario] = useState<UsuarioAcesso | null>(null);
  const [editaDep, setEditaDep] = useState<DepartamentoAcesso | null>(null);
  const usuarios = useUsuarios(), departamentos = useDepartamentos();
  const criarDep = useCriarDepartamento();
  const atualizar = useAtualizarUsuario();
  const nomeDep = useMemo(() => new Map((departamentos.data ?? []).map((d) => [d.id, d.nome])), [departamentos.data]);

  const colunasUsuario: Coluna<UsuarioAcesso>[] = [
    { chave: 'u', titulo: 'Usuário', render: (u) => <div className="min-w-0"><p className="truncate font-medium">{u.pessoa?.nome ?? u.username}{u.id === me?.id && <Badge tom="marca" className="ml-2">Você</Badge>}</p><p className="truncate text-xs text-muted">@{u.username}{u.pessoa ? ` · ${u.pessoa.email}` : ''}</p></div> },
    { chave: 'd', titulo: 'Departamento', ocultarAte: 'sm', render: (u) => <span className="text-muted">{(u.departamentoId && nomeDep.get(u.departamentoId)) || '—'}</span> },
    { chave: 'p', titulo: 'Acessos', ocultarAte: 'lg', render: (u) => <div className="flex max-w-md flex-wrap gap-1">{resumo(nomesDe(u.permissoes)).map((r) => <Badge key={r}>{r}</Badge>)}{u.permissoes.length === 0 && <span className="text-xs text-muted">Nenhuma</span>}</div> },
    { chave: 'a', titulo: 'Ativo', render: (u) => <Switch rotulo="" valor={u.ativo} disabled={!podeEditar || u.id === me?.id || atualizar.isPending} onChange={(v) => atualizar.mutate({ id: u.id, dados: { ativo: v } }, { onSuccess: () => toast.sucesso(v ? 'Usuário reativado.' : 'Usuário desativado: as sessões dele foram encerradas.') })} /> },
    ...(podeEditar ? [{ chave: 'x', titulo: '', alinhar: 'right' as const, render: (u: UsuarioAcesso) => <Button variante="outline" tamanho="sm" disabled={u.id === me?.id} title={u.id === me?.id ? 'Você não pode alterar as próprias permissões.' : undefined} onClick={() => setEditaUsuario(u)}>Permissões</Button> }] : []),
  ];
  const colunasDep: Coluna<DepartamentoAcesso>[] = [
    { chave: 'n', titulo: 'Departamento', render: (d) => <span className="font-medium">{d.nome}{d.sigla && <span className="ml-2 text-xs text-muted">{d.sigla}</span>}</span> },
    { chave: 'p', titulo: 'O que o departamento permite', render: (d) => <div className="flex max-w-xl flex-wrap gap-1">{resumo(nomesDe(d.permissoes)).map((r) => <Badge key={r}>{r}</Badge>)}{d.permissoes.length === 0 && <span className="text-xs text-muted">Nada liberado</span>}</div> },
    ...(podeEditar ? [{ chave: 'x', titulo: '', alinhar: 'right' as const, render: (d: DepartamentoAcesso) => <Button variante="outline" tamanho="sm" disabled={d.id === me?.departamento?.id} title={d.id === me?.departamento?.id ? 'Você não pode alterar o departamento ao qual pertence.' : undefined} onClick={() => setEditaDep(d)}>Permissões</Button> }] : []),
  ];

  return (
    <>
      <PageHeader titulo="Acessos" descricao="Quem entra no sistema e o que cada pessoa pode ver e alterar."
        acoes={podeEditar && (aba === 'usuarios' ? <Button icone={<Plus className="size-4" />} onClick={() => setNovoUsuario(true)}>Novo usuário</Button> : <Button icone={<Plus className="size-4" />} onClick={() => setNovoDep(true)}>Novo departamento</Button>)} />
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-xs text-muted"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" /><p>O acesso efetivo é a <strong className="text-fg">interseção</strong> entre as permissões do usuário e as do departamento dele. Você só concede o que você mesmo possui e não altera as próprias permissões.</p></div>
      <Tabs ativa={aba} onChange={setAba} abas={[{ chave: 'usuarios', rotulo: 'Usuários', contagem: usuarios.data?.length }, { chave: 'departamentos', rotulo: 'Departamentos', contagem: departamentos.data?.length }]} />
      {aba === 'usuarios' && <Card><DataTable colunas={colunasUsuario} linhas={usuarios.data} chaveLinha={(u) => u.id} carregando={usuarios.isPending} erro={usuarios.error?.message} onRetry={() => usuarios.refetch()} vazio={{ titulo: 'Nenhum usuário' }} /></Card>}
      {aba === 'departamentos' && <Card><DataTable colunas={colunasDep} linhas={departamentos.data} chaveLinha={(d) => d.id} carregando={departamentos.isPending} erro={departamentos.error?.message} onRetry={() => departamentos.refetch()} vazio={{ titulo: 'Nenhum departamento', descricao: 'Crie departamentos como Vendas, Estoque e Financeiro.' }} /></Card>}

      <UsuarioFormModal aberto={novoUsuario} onFechar={() => setNovoUsuario(false)} />
      <FormModal aberto={novoDep} onFechar={() => setNovoDep(false)} titulo="Novo departamento" rotuloSalvar="Criar" campos={[{ chave: 'nome', rotulo: 'Nome', obrigatorio: true, placeholder: 'Ex.: Vendas' }, { chave: 'sigla', rotulo: 'Sigla (opcional)', placeholder: 'Ex.: VND', transformar: (v) => v.toUpperCase().slice(0, 10) }]}
        onSubmit={async (v) => { await criarDep.mutateAsync({ nome: v.nome, sigla: v.sigla || undefined }); toast.sucesso('Departamento criado. Defina agora as permissões dele.'); }} />
      {editaUsuario && <EditorUsuario usuario={editaUsuario} onFechar={() => setEditaUsuario(null)} departamentos={departamentos.data ?? []} />}
      {editaDep && <EditorDepartamento departamento={editaDep} onFechar={() => setEditaDep(null)} />}
    </>
  );
}

function EditorDepartamento({ departamento, onFechar }: { departamento: DepartamentoAcesso; onFechar: () => void }) {
  const { me } = useCan();
  const catalogo = useCatalogo();
  const salvar = useDefinirPermissoesDepartamento();
  const [valor, setValor] = useState(() => nomesDe(departamento.permissoes));
  const concedíveis = useMemo(() => new Set(me?.permissoes ?? []), [me?.permissoes]);
  return (
    <Modal aberto onFechar={onFechar} titulo={`Permissões · ${departamento.nome}`} descricao="Define o teto de acesso das pessoas deste departamento." tamanho="md"
      rodape={<><Button variante="outline" onClick={onFechar} disabled={salvar.isPending}>Cancelar</Button><Button carregando={salvar.isPending} disabled={catalogo.isPending} onClick={async () => { try { await salvar.mutateAsync({ id: departamento.id, permissoes: valor }); toast.sucesso('Permissões do departamento atualizadas.'); onFechar(); } catch { /* aviso já exibido */ } }}>Salvar</Button></>}>
      <PermissoesMatriz valor={valor} onChange={setValor} concedíveis={concedíveis} />
    </Modal>
  );
}

function EditorUsuario({ usuario, departamentos, onFechar }: { usuario: UsuarioAcesso; departamentos: DepartamentoAcesso[]; onFechar: () => void }) {
  const { me } = useCan();
  const salvar = useDefinirPermissoesUsuario();
  const atualizar = useAtualizarUsuario();
  const [valor, setValor] = useState(() => nomesDe(usuario.permissoes));
  const [depId, setDepId] = useState(String(usuario.departamentoId ?? ''));
  const dep = departamentos.find((d) => d.id === Number(depId));
  const doDep = new Set(dep ? nomesDe(dep.permissoes) : []);
  const concedíveis = useMemo(() => new Set(me?.permissoes ?? []), [me?.permissoes]);
  const [enviando, setEnviando] = useState(false);

  async function gravar() {
    setEnviando(true);
    try {
      if (depId && Number(depId) !== usuario.departamentoId) await atualizar.mutateAsync({ id: usuario.id, dados: { departamentoId: Number(depId) } });
      await salvar.mutateAsync({ id: usuario.id, permissoes: valor });
      toast.sucesso('Acessos atualizados', 'As sessões abertas deste usuário foram encerradas para aplicar as mudanças.');
      onFechar();
    } catch { /* aviso já exibido */ } finally { setEnviando(false); }
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={`Acessos · ${usuario.pessoa?.nome ?? usuario.username}`} tamanho="md"
      rodape={<><Button variante="outline" onClick={onFechar} disabled={enviando}>Cancelar</Button><Button carregando={enviando} onClick={gravar}>Salvar</Button></>}>
      <div className="space-y-4">
        <Select rotulo="Departamento" value={depId} onChange={(e) => setDepId(e.target.value)}>
          <option value="">Sem departamento</option>{departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </Select>
        <PermissoesMatriz valor={valor} onChange={setValor} concedíveis={concedíveis} bloqueadasPeloDepartamento={dep ? new Set(valor.filter((p) => !doDep.has(p))) : null} />
      </div>
    </Modal>
  );
}
