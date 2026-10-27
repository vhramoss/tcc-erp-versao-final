'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { mascaraDocumento, soDigitos } from '@/lib/format';
import type { Pessoa } from '@/lib/tipos';

type Dados = Omit<Pessoa, 'id'>;
const VAZIO: Dados = { nome: '', email: '', cpfCnpj: '', telefone: '', endereco: '', tipo: 'FISICA' };

interface Props {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  inicial?: Pessoa;
  rotuloSalvar?: string;
  onSalvar: (dados: Dados) => Promise<unknown>;
}

/** Cadastro de pessoa (cliente ou fornecedor): mesmos campos, mesma validação. */
export function PessoaFormModal({ aberto, onFechar, titulo, inicial, rotuloSalvar = 'Salvar', onSalvar }: Props) {
  const [f, setF] = useState<Dados>(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setF(inicial ? { nome: inicial.nome, email: inicial.email, cpfCnpj: mascaraDocumento(inicial.cpfCnpj), telefone: inicial.telefone ?? '', endereco: inicial.endereco ?? '', tipo: inicial.tipo } : VAZIO);
    setErros({});
  }, [aberto, inicial]);

  const mudar = <K extends keyof Dados>(k: K, v: Dados[K]) => setF((a) => ({ ...a, [k]: v }));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const doc = soDigitos(f.cpfCnpj ?? '');
    const novo: Record<string, string> = {};
    if (!f.nome.trim()) novo.nome = 'Informe o nome.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) novo.email = 'Informe um e-mail válido.';
    if (f.tipo === 'FISICA' ? doc.length !== 11 : doc.length !== 14) novo.cpfCnpj = f.tipo === 'FISICA' ? 'O CPF deve ter 11 dígitos.' : 'O CNPJ deve ter 14 dígitos.';
    setErros(novo);
    if (Object.keys(novo).length) return;
    setEnviando(true);
    try {
      await onSalvar({ nome: f.nome.trim(), email: f.email.trim().toLowerCase(), cpfCnpj: doc, telefone: f.telefone?.trim() || undefined, endereco: f.endereco?.trim() || undefined, tipo: f.tipo });
      onFechar();
    } catch { /* aviso já exibido */ } finally { setEnviando(false); }
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={titulo} tamanho="lg"
      rodape={<><Button variante="outline" onClick={onFechar} disabled={enviando}>Cancelar</Button><Button type="submit" form="form-pessoa" carregando={enviando}>{rotuloSalvar}</Button></>}>
      <form id="form-pessoa" onSubmit={enviar} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Select rotulo="Tipo de pessoa" value={f.tipo} onChange={(e) => { mudar('tipo', e.target.value as Dados['tipo']); mudar('cpfCnpj', ''); }}>
          <option value="FISICA">Pessoa física</option><option value="JURIDICA">Pessoa jurídica</option>
        </Select>
        <Input rotulo={f.tipo === 'FISICA' ? 'CPF' : 'CNPJ'} obrigatorio inputMode="numeric" value={f.cpfCnpj} onChange={(e) => mudar('cpfCnpj', mascaraDocumento(e.target.value))} erro={erros.cpfCnpj} />
        <Input className="sm:col-span-2" rotulo={f.tipo === 'FISICA' ? 'Nome completo' : 'Razão social / nome fantasia'} obrigatorio value={f.nome} onChange={(e) => mudar('nome', e.target.value)} erro={erros.nome} />
        <Input rotulo="E-mail" obrigatorio type="email" value={f.email} onChange={(e) => mudar('email', e.target.value)} erro={erros.email} />
        <Input rotulo="Telefone" inputMode="tel" value={f.telefone ?? ''} onChange={(e) => mudar('telefone', e.target.value)} />
        <Input className="sm:col-span-2" rotulo="Endereço" value={f.endereco ?? ''} onChange={(e) => mudar('endereco', e.target.value)} />
      </form>
    </Modal>
  );
}
