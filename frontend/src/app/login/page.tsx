'use client';
import { Eye, EyeOff, Loader2, Lock, User, Building2, AlertCircle } from 'lucide-react';
import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { ICONE_MARCA } from '@/components/layout/nav';
import { Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { mascaraCnpj, soDigitos } from '@/lib/format';

const NOME_APP = process.env.NEXT_PUBLIC_APP_NAME ?? 'ERP PME';

// Só aceita caminhos internos como destino pós-login (evita redirecionamento aberto).
const destinoSeguro = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login') ? next : '/');

function Formulario() {
  const params = useSearchParams();
  const [cnpj, setCnpj] = useState('');
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const expirada = params.has('expirada');

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (soDigitos(cnpj).length !== 14) return setErro('Informe o CNPJ da empresa com 14 dígitos.');
    setEnviando(true);
    try {
      const resposta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-requested-with': 'erp-web' },
        body: JSON.stringify({ cnpj, username, senha }),
        credentials: 'same-origin',
      });
      if (resposta.ok) {
        // Navegação completa: garante que o middleware já enxergue o cookie de sessão.
        window.location.assign(destinoSeguro(params.get('next')));
        return;
      }
      const corpo = (await resposta.json().catch(() => ({}))) as { message?: string };
      setErro(resposta.status === 401 ? 'Empresa, usuário ou senha incorretos.' : (corpo.message ?? 'Não foi possível entrar.'));
    } catch {
      setErro('Sem conexão com o servidor. Verifique sua internet.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="space-y-4" noValidate>
      {expirada && !erro && (
        <div role="status" className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2.5 text-xs text-warning"><AlertCircle className="mt-px size-4 shrink-0" />Sua sessão expirou. Entre novamente para continuar.</div>
      )}
      {erro && <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-xs text-danger"><AlertCircle className="mt-px size-4 shrink-0" />{erro}</div>}
      <div className="relative">
        <Building2 className="pointer-events-none absolute left-3 top-[34px] size-4 text-muted" aria-hidden />
        <Input rotulo="CNPJ da empresa" inputMode="numeric" autoComplete="organization" placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => setCnpj(mascaraCnpj(e.target.value))} className="[&_input]:pl-9" />
      </div>
      <div className="relative">
        <User className="pointer-events-none absolute left-3 top-[34px] size-4 text-muted" aria-hidden />
        <Input rotulo="Usuário" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} className="[&_input]:pl-9" />
      </div>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-[34px] size-4 text-muted" aria-hidden />
        <Input rotulo="Senha" type={mostrar ? 'text' : 'password'} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="[&_input]:px-9" />
        <button type="button" onClick={() => setMostrar((v) => !v)} aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-2.5 top-[29px] rounded p-1.5 text-muted hover:text-fg">
          {mostrar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <Button type="submit" tamanho="lg" className="w-full" disabled={enviando || !username || !senha || !cnpj}>
        {enviando && <Loader2 className="size-4 animate-spin" />}Entrar
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-brand p-12 text-brand-fg lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-32 -left-16 size-[28rem] rounded-full bg-white/10" aria-hidden />
        <div className="relative flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-white/20"><ICONE_MARCA className="size-6" /></div><span className="text-lg font-semibold">{NOME_APP}</span></div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">Todo o seu negócio em um só lugar.</h1>
          <p className="mt-4 text-base/relaxed opacity-90">Estoque, pedidos, clientes e financeiro conversando entre si. Sem planilhas soltas, sem surpresa no fim do mês.</p>
        </div>
        <p className="relative text-xs opacity-75">Sistema ERP web para pequenas empresas e comércios locais.</p>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><div className="grid size-10 place-items-center rounded-xl bg-brand text-brand-fg"><ICONE_MARCA className="size-5" /></div><span className="text-lg font-semibold">{NOME_APP}</span></div>
          <h2 className="text-2xl font-semibold tracking-tight">Entrar</h2>
          <p className="mb-6 mt-1.5 text-sm text-muted">Use o CNPJ da empresa e as credenciais fornecidas pelo administrador.</p>
          <Suspense fallback={null}><Formulario /></Suspense>
        </div>
      </section>
    </main>
  );
}
