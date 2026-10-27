'use client';
import { Dices } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal, Select, toast } from '@/components/ui';
import { mascaraDocumento, soDigitos } from '@/lib/format';
import { useCan } from '@/lib/use-auth';
import { useCriarUsuario, useDepartamentos } from './api';
import { PermissoesMatriz } from './permissoes-matriz';
import { nomesDe } from './types';

const VAZIO = { nome: '', email: '', cpf: '', username: '', senha: '', departamentoId: '' };

function gerarSenha(): string {
  const alfabeto = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
  const bytes = crypto.getRandomValues(new Uint32Array(16));
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
}

export function UsuarioFormModal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { me } = useCan();
  const departamentos = useDepartamentos();
  const criar = useCriarUsuario();
  const [f, setF] = useState(VAZIO);
  const [permissoes, setPermissoes] = useState<string[]>([]);
  const [mostrar, setMostrar] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  useEffect(() => { if (aberto) { setF(VAZIO); setPermissoes([]); setMostrar(false); setErros({}); } }, [aberto]);
  const mudar = (k: keyof typeof VAZIO, v: string) => setF((a) => ({ ...a, [k]: v }));
  const dep = departamentos.data?.find((d) => d.id === Number(f.departamentoId));
  const doDepartamento = new Set(dep ? nomesDe(dep.permissoes) : []);
  const concedíveis = new Set(me?.permissoes ?? []);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const novo: Record<string, string> = {};
    if (!f.nome.trim()) novo.nome = 'Informe o nome.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) novo.email = 'Informe um e-mail válido.';
    if (soDigitos(f.cpf).length !== 11) novo.cpf = 'O CPF deve ter 11 dígitos.';
    if (!/^[a-z0-9._-]{3,50}$/i.test(f.username.trim())) novo.username = 'Use de 3 a 50 letras, números, ponto, hífen ou sublinhado.';
    if (f.senha.length < 12) novo.senha = 'A senha deve ter ao menos 12 caracteres.';
    if (!f.departamentoId) novo.departamentoId = 'Selecione o departamento.';
    setErros(novo);
    if (Object.keys(novo).length) return;
    try {
      await criar.mutateAsync({ username: f.username.trim(), senha: f.senha, departamentoId: Number(f.departamentoId), permissoes, pessoa: { nome: f.nome.trim(), email: f.email.trim().toLowerCase(), cpfCnpj: soDigitos(f.cpf), tipo: 'FISICA' } });
      toast.sucesso('Usuário criado.', 'Informe a senha ao usuário por um canal seguro.');
      onFechar();
    } catch { /* aviso já exibido */ }
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Novo usuário" tamanho="lg" descricao="As permissões efetivas são a interseção entre o que o usuário recebe e o que o departamento permite."
      rodape={<><Button variante="outline" onClick={onFechar} disabled={criar.isPending}>Cancelar</Button><Button type="submit" form="form-usuario" carregando={criar.isPending}>Criar usuário</Button></>}>
      <form id="form-usuario" onSubmit={enviar} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input className="sm:col-span-2" rotulo="Nome completo" obrigatorio value={f.nome} onChange={(e) => mudar('nome', e.target.value)} erro={erros.nome} />
          <Input rotulo="E-mail" obrigatorio type="email" value={f.email} onChange={(e) => mudar('email', e.target.value)} erro={erros.email} />
          <Input rotulo="CPF" obrigatorio inputMode="numeric" value={f.cpf} onChange={(e) => mudar('cpf', mascaraDocumento(e.target.value))} erro={erros.cpf} />
          <Input rotulo="Nome de usuário (login)" obrigatorio autoCapitalize="none" value={f.username} onChange={(e) => mudar('username', e.target.value)} erro={erros.username} />
          <Select rotulo="Departamento" obrigatorio value={f.departamentoId} onChange={(e) => mudar('departamentoId', e.target.value)} erro={erros.departamentoId}>
            <option value="">Selecione…</option>{departamentos.data?.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </Select>
          <div className="sm:col-span-2">
            <Input rotulo="Senha inicial" obrigatorio type={mostrar ? 'text' : 'password'} autoComplete="new-password" value={f.senha} onChange={(e) => mudar('senha', e.target.value)} erro={erros.senha} dica="Mínimo de 12 caracteres. O usuário poderá trocá-la depois." />
            <div className="mt-2 flex gap-2">
              <Button variante="outline" tamanho="sm" icone={<Dices className="size-4" />} onClick={() => { mudar('senha', gerarSenha()); setMostrar(true); }}>Gerar senha forte</Button>
              <Button variante="ghost" tamanho="sm" onClick={() => setMostrar((v) => !v)}>{mostrar ? 'Ocultar' : 'Mostrar'}</Button>
            </div>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Permissões do usuário</p>
          <PermissoesMatriz valor={permissoes} onChange={setPermissoes} concedíveis={concedíveis} bloqueadasPeloDepartamento={dep ? new Set(permissoes.filter((p) => !doDepartamento.has(p))) : null} />
        </div>
      </form>
    </Modal>
  );
}
