'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal, Select, Switch, toast } from '@/components/ui';
import { cn } from '@/lib/cn';
import { arredondar, hojeISO, lerDecimal } from '@/lib/format';
import { useCentrosCusto, useCriarTransacao, useFormasPagamento, usePlanosContas } from './api';
import type { TipoTransacao } from './types';

export function LancamentoFormModal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const planos = usePlanosContas(aberto), centros = useCentrosCusto(aberto), formas = useFormasPagamento(aberto);
  const criar = useCriarTransacao();
  const [tipo, setTipo] = useState<TipoTransacao>('DESPESA');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState(hojeISO());
  const [pago, setPago] = useState(false);
  const [planoId, setPlanoId] = useState('');
  const [centroId, setCentroId] = useState('');
  const [formaId, setFormaId] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!aberto) return;
    setTipo('DESPESA'); setDescricao(''); setValor(''); setVencimento(hojeISO()); setPago(false); setPlanoId(''); setCentroId(''); setFormaId(''); setErros({});
  }, [aberto]);

  const planosDoTipo = (planos.data ?? []).filter((p) => p.tipo === tipo);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const v = lerDecimal(valor);
    const novo: Record<string, string> = {};
    if (!descricao.trim()) novo.descricao = 'Descreva o lançamento.';
    if (Number.isNaN(v) || v <= 0) novo.valor = 'Informe um valor maior que zero.';
    if (!vencimento) novo.vencimento = 'Informe o vencimento.';
    setErros(novo);
    if (Object.keys(novo).length) return;
    try {
      await criar.mutateAsync({ descricao: descricao.trim(), valor: arredondar(v), tipo, dataVencimento: vencimento, status: pago ? 'PAGO' : 'PENDENTE', planoContasId: Number(planoId) || undefined, centroCustoId: Number(centroId) || undefined, formaPagamentoId: Number(formaId) || undefined });
      toast.sucesso(tipo === 'RECEITA' ? 'Receita lançada.' : 'Despesa lançada.');
      onFechar();
    } catch { /* aviso já exibido */ }
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Novo lançamento" descricao="Receitas e despesas avulsas. Pedidos e compras geram seus lançamentos sozinhos." tamanho="lg"
      rodape={<><Button variante="outline" onClick={onFechar} disabled={criar.isPending}>Cancelar</Button><Button type="submit" form="form-lanc" carregando={criar.isPending}>Lançar</Button></>}>
      <form id="form-lanc" onSubmit={enviar} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-2 gap-2 sm:col-span-2">
          {([['RECEITA', 'Receita (entrada)', 'border-success bg-success-soft text-success'], ['DESPESA', 'Despesa (saída)', 'border-danger bg-danger-soft text-danger']] as const).map(([v, r, ativo]) => (
            <button key={v} type="button" role="radio" aria-checked={tipo === v} onClick={() => { setTipo(v); setPlanoId(''); }} className={cn('rounded-lg border px-3 py-2.5 text-sm font-medium transition', tipo === v ? ativo : 'border-line text-muted hover:bg-surface-2')}>{r}</button>
          ))}
        </div>
        <Input className="sm:col-span-2" rotulo="Descrição" obrigatorio value={descricao} onChange={(e) => setDescricao(e.target.value)} erro={erros.descricao} placeholder="Ex.: Aluguel de novembro" />
        <Input rotulo="Valor (R$)" obrigatorio inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} erro={erros.valor} />
        <Input rotulo="Vencimento" obrigatorio type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} erro={erros.vencimento} />
        <Select rotulo="Plano de contas" value={planoId} onChange={(e) => setPlanoId(e.target.value)} dica={planos.isSuccess && planosDoTipo.length === 0 ? `Nenhum plano de ${tipo === 'RECEITA' ? 'receita' : 'despesa'} cadastrado (aba Tesouraria).` : undefined}>
          <option value="">Sem classificação</option>{planosDoTipo.map((p) => <option key={p.id} value={p.id}>{p.codigo} — {p.nome}</option>)}
        </Select>
        <Select rotulo="Centro de custo" value={centroId} onChange={(e) => setCentroId(e.target.value)}>
          <option value="">Sem centro de custo</option>{centros.data?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </Select>
        <Select rotulo="Forma de pagamento" value={formaId} onChange={(e) => setFormaId(e.target.value)}>
          <option value="">Não informada</option>{formas.data?.filter((f) => f.ativo).map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </Select>
        <div className="flex items-end pb-1"><Switch rotulo={tipo === 'RECEITA' ? 'Já recebido' : 'Já pago'} descricao="Marca como liquidado hoje." valor={pago} onChange={setPago} /></div>
      </form>
    </Modal>
  );
}
