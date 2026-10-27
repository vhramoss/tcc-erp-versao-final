'use client';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button, Input, Modal, SearchSelect, Select, Textarea, toast } from '@/components/ui';
import { cn } from '@/lib/cn';
import { lerDecimal, numero } from '@/lib/format';
import { useProdutos } from '@/modules/produtos/api';
import { useAlmoxarifados, useMovimentar } from './api';

interface Props { aberto: boolean; onFechar: () => void; produtoInicial?: number }

export function MovimentacaoModal({ aberto, onFechar, produtoInicial }: Props) {
  const produtos = useProdutos(aberto);
  const almox = useAlmoxarifados(aberto);
  const movimentar = useMovimentar();
  const [produtoId, setProdutoId] = useState('');
  const [almoxId, setAlmoxId] = useState('');
  const [tipo, setTipo] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});

  const ativos = useMemo(() => (almox.data ?? []).filter((a) => a.ativo), [almox.data]);

  useEffect(() => {
    if (!aberto) return;
    setProdutoId(String(produtoInicial ?? '')); setTipo('ENTRADA'); setQuantidade(''); setObservacao(''); setErros({});
  }, [aberto, produtoInicial]);
  useEffect(() => { if (aberto && !almoxId && ativos.length) setAlmoxId(String(ativos[0].id)); }, [aberto, almoxId, ativos]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const q = lerDecimal(quantidade);
    const novo: Record<string, string> = {};
    if (!produtoId) novo.produto = 'Selecione o produto.';
    if (!almoxId) novo.almox = 'Selecione o almoxarifado.';
    if (Number.isNaN(q) || q <= 0) novo.quantidade = 'Informe uma quantidade maior que zero.';
    if (!observacao.trim()) novo.observacao = 'Explique o motivo (ex.: contagem, perda, compra avulsa).';
    setErros(novo);
    if (Object.keys(novo).length) return;
    try {
      const r = await movimentar.mutateAsync({ produtoId: Number(produtoId), almoxarifadoId: Number(almoxId), quantidade: q, tipo, observacao: observacao.trim() });
      toast.sucesso(`${tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} registrada. Novo saldo no almoxarifado: ${numero(r.novoSaldo, 3)}.`);
      if (r.alerta?.alerta) toast.aviso('Estoque no mínimo ou abaixo', `${r.alerta.mensagem}\nSaldo total: ${numero(r.alerta.qtdAtual, 3)} · mínimo: ${numero(r.alerta.estoqueMinimo, 3)}`);
      onFechar();
    } catch { /* aviso já exibido */ }
  }

  const opcoes = (produtos.data ?? []).map((p) => ({ valor: p.id, rotulo: p.nome, detalhe: p.sku }));

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Movimentar estoque" descricao="Toda movimentação fica registrada no histórico, com usuário e horário."
      rodape={<><Button variante="outline" onClick={onFechar} disabled={movimentar.isPending}>Cancelar</Button><Button type="submit" form="form-mov" carregando={movimentar.isPending}>Registrar {tipo === 'ENTRADA' ? 'entrada' : 'saída'}</Button></>}>
      <form id="form-mov" onSubmit={enviar} className="space-y-4" noValidate>
        <div role="radiogroup" aria-label="Tipo de movimentação" className="grid grid-cols-2 gap-2">
          {([['ENTRADA', 'Entrada', ArrowDownToLine], ['SAIDA', 'Saída', ArrowUpFromLine]] as const).map(([valor, rotulo, Icone]) => (
            <button key={valor} type="button" role="radio" aria-checked={tipo === valor} onClick={() => setTipo(valor)}
              className={cn('flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition', tipo === valor ? (valor === 'ENTRADA' ? 'border-success bg-success-soft text-success' : 'border-warning bg-warning-soft text-warning') : 'border-line text-muted hover:bg-surface-2')}>
              <Icone className="size-4" />{rotulo}
            </button>
          ))}
        </div>
        <SearchSelect rotulo="Produto" obrigatorio opcoes={opcoes} valor={produtoId} onChange={setProdutoId} carregando={produtos.isPending} placeholder="Busque por nome ou SKU" erro={erros.produto} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select rotulo="Almoxarifado" obrigatorio value={almoxId} onChange={(e) => setAlmoxId(e.target.value)} erro={erros.almox}>
            {ativos.length === 0 && <option value="">Nenhum almoxarifado ativo</option>}
            {ativos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </Select>
          <Input rotulo="Quantidade" obrigatorio inputMode="decimal" placeholder="0" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} erro={erros.quantidade} />
        </div>
        <Textarea rotulo="Motivo / observação" obrigatorio value={observacao} onChange={(e) => setObservacao(e.target.value)} erro={erros.observacao} placeholder="Ex.: compra avulsa, contagem de inventário, perda…" />
      </form>
    </Modal>
  );
}
