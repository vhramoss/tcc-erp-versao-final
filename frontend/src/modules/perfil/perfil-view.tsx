'use client';
import { Building2, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { LinhaInfo } from '@/components/domain/linha-info';
import { Badge, Button, Card, CardBody, CardHeader, Input, PageHeader, Skeleton, toast } from '@/components/ui';
import { api, ApiError, encerrarSessao } from '@/lib/api';
import { mascaraCnpj } from '@/lib/format';
import { RECURSOS, ROTULO_RECURSO } from '@/lib/permissoes';
import { useMe } from '@/lib/use-auth';

export function PerfilView() {
  const { data: me, isPending } = useMe();
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function trocar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (nova.length < 12) return setErro('A nova senha deve ter ao menos 12 caracteres.');
    if (nova !== confirmacao) return setErro('A confirmação não confere com a nova senha.');
    if (nova === atual) return setErro('A nova senha deve ser diferente da atual.');
    setEnviando(true);
    try {
      await api('/auth/senha', { method: 'PATCH', body: { senhaAtual: atual, novaSenha: nova } });
      toast.sucesso('Senha alterada', 'Por segurança, todas as sessões foram encerradas. Entre novamente.');
      setTimeout(() => void encerrarSessao('sair'), 1200);
    } catch (e) {
      setErro(e instanceof ApiError ? (e.status === 401 || e.status === 403 ? 'Senha atual incorreta.' : e.message) : 'Não foi possível alterar a senha.');
    } finally { setEnviando(false); }
  }

  const efetivas = new Set(me?.permissoes ?? []);

  return (
    <>
      <PageHeader titulo="Minha conta" descricao="Seus dados de acesso e segurança." />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader titulo="Dados do usuário" />
          <CardBody className="pt-2">
            {isPending ? <Skeleton className="h-32 w-full" /> : (
              <dl className="divide-y divide-line">
                <LinhaInfo rotulo="Nome">{me?.nome ?? '—'}</LinhaInfo>
                <LinhaInfo rotulo="Usuário">@{me?.username}</LinhaInfo>
                <LinhaInfo rotulo="E-mail">{me?.email ?? '—'}</LinhaInfo>
                <LinhaInfo rotulo="Empresa"><span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5 text-muted" />{me?.empresa?.nome}</span></LinhaInfo>
                <LinhaInfo rotulo="CNPJ"><span className="num">{me?.empresa ? mascaraCnpj(me.empresa.cnpj) : '—'}</span></LinhaInfo>
                <LinhaInfo rotulo="Departamento">{me?.departamento?.nome ?? '—'}</LinhaInfo>
              </dl>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader titulo="Alterar senha" descricao="Ao trocar, todas as suas sessões são encerradas." />
          <CardBody>
            <form onSubmit={trocar} className="space-y-4" noValidate>
              {erro && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2.5 text-xs text-danger">{erro}</p>}
              <Input rotulo="Senha atual" type="password" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} />
              <Input rotulo="Nova senha" type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} dica="Mínimo de 12 caracteres." />
              <Input rotulo="Confirmar nova senha" type="password" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
              <Button type="submit" icone={<KeyRound className="size-4" />} carregando={enviando} disabled={!atual || !nova || !confirmacao}>Alterar senha</Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader titulo="Seus acessos" descricao="Permissões efetivas (usuário ∩ departamento)." />
          <CardBody className="space-y-2.5">
            {RECURSOS.map((r) => (
              <div key={r} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-muted" />{ROTULO_RECURSO[r]}</span>
                {efetivas.has(`${r}.gerenciar`) ? <Badge tom="sucesso">Ver e alterar</Badge> : efetivas.has(`${r}.ler`) ? <Badge tom="info">Somente ver</Badge> : <Badge>Sem acesso</Badge>}
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader titulo="Sessões" />
          <CardBody>
            <p className="mb-3 text-sm text-muted">Use se perdeu um aparelho ou suspeita de acesso indevido: encerra a sessão em todos os dispositivos.</p>
            <Button variante="outline" icone={<LogOut className="size-4" />} onClick={() => void encerrarSessao('sair', true)}>Sair de todos os dispositivos</Button>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
