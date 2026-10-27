'use client';
import { ArrowLeft, ChevronDown, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Button, Card, CardBody, CardHeader, Input, PageHeader, SearchSelect, Select, Textarea, toast } from '@/components/ui';
import { arredondar, brl, hojeISO, lerDecimal, soDigitos, somarDias } from '@/lib/format';
import { useCan } from '@/lib/use-auth';
import { useAlmoxarifados } from '@/modules/estoque/api';
import { useFormasPagamento } from '@/modules/financeiro/api';
import { useProdutos } from '@/modules/produtos/api';
import { useCriarCompra, useFornecedores } from './api';

interface Linha { chave: number; produtoId: string; quantidade: string; valorUnitario: string }
let proxima = 1;
const nova = (): Linha => ({ chave: proxima++, produtoId: '', quantidade: '1', valorUnitario: '' });

export function NovaCompra() {
  const router = useRouter();
  const { ler } = useCan();
  const fornecedores = useFornecedores(), produtos = useProdutos(), almox = useAlmoxarifados();
  const formas = useFormasPagamento(ler('financeiro'));
  const criar = useCriarCompra();

  const [fornecedorId, setFornecedorId] = useState('');
  const [almoxId, setAlmoxId] = useState('');
  const [formaId, setFormaId] = useState('');
  const [vencimento, setVencimento] = useState(() => somarDias(hojeISO(), 30));
  const [referencia, setReferencia] = useState(() => `COMP-${hojeISO().replaceAll('-', '')}-${Math.floor(Math.random() * 900 + 100)}`);
  const [observacao, setObservacao] = useState('');
  const [acrescimos, setAcrescimos] = useState('');
  const [desconto, setDesconto] = useState('');
  const [comNota, setComNota] = useState(false);
  const [nota, setNota] = useState({ numero: '', serie: '', dataEmissao: hojeISO(), chave: '' });
  const [linhas, setLinhas] = useState<Linha[]>(() => [nova()]);
  const [erros, setErros] = useState<Record<string, string>>({});

  const ativos = useMemo(() => (almox.data ?? []).filter((a) => a.ativo), [almox.data]);
  const almoxEscolhido = almoxId || ativos[0]?.id || '';
  const mudar = (chave: number, campo: keyof Omit<Linha, 'chave'>, valor: string) => setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, [campo]: valor } : l)));

  const subtotais = linhas.map((l) => { const q = lerDecimal(l.quantidade), v = lerDecimal(l.valorUnitario); return l.produtoId && q > 0 && v >= 0 ? arredondar(q * v) : 0; });
  const extra = Math.max(0, lerDecimal(acrescimos) || 0), desc = Math.max(0, lerDecimal(desconto) || 0);
  const total = arredondar(subtotais.reduce((s, x) => s + x, 0) + extra - desc);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const novo: Record<string, string> = {};
    const usadas = linhas.filter((l) => l.produtoId);
    if (!fornecedorId) novo.fornecedor = 'Selecione o fornecedor.';
    if (!almoxEscolhido) novo.almox = 'Selecione o almoxarifado.';
    if (!referencia.trim()) novo.referencia = 'Informe a referência.';
    if (!vencimento) novo.vencimento = 'Informe o vencimento.';
    if (!usadas.length) novo.itens = 'Adicione ao menos um produto.';
    else if (usadas.some((l) => !(lerDecimal(l.quantidade) > 0) || Number.isNaN(lerDecimal(l.valorUnitario)) || lerDecimal(l.valorUnitario) < 0)) novo.itens = 'Preencha quantidade e valor unitário de todos os itens.';
    if (new Set(usadas.map((l) => l.produtoId)).size !== usadas.length) novo.itens = 'Um produto não pode aparecer duas vezes.';
    if (total <= 0) novo.itens = novo.itens ?? 'O total da compra deve ser maior que zero.';
    if (comNota) {
      if (!/^\d{1,9}$/.test(nota.numero)) novo.nota = 'Número da nota: de 1 a 9 dígitos.';
      else if (!/^\d{1,3}$/.test(nota.serie)) novo.nota = 'Série: de 1 a 3 dígitos.';
      else if (nota.chave && soDigitos(nota.chave).length !== 44) novo.nota = 'A chave de acesso deve ter 44 dígitos.';
    }
    setErros(novo);
    if (Object.keys(novo).length) return;
    try {
      const c = await criar.mutateAsync({
        referencia: referencia.trim(), fornecedorId: Number(fornecedorId), almoxarifadoId: Number(almoxEscolhido), dataVencimento: vencimento, formaPagamentoId: Number(formaId) || undefined, observacao: observacao.trim() || undefined,
        acrescimos: extra > 0 ? arredondar(extra) : undefined, desconto: desc > 0 ? arredondar(desc) : undefined,
        itens: usadas.map((l) => ({ produtoId: Number(l.produtoId), quantidade: arredondar(lerDecimal(l.quantidade), 3), valorUnitario: arredondar(lerDecimal(l.valorUnitario), 10) })),
        nota: comNota ? { numero: nota.numero, serie: nota.serie, dataEmissao: nota.dataEmissao, chave: soDigitos(nota.chave) || undefined } : undefined,
      });
      toast.sucesso(`Compra ${c.referencia} registrada`, 'Estoque abastecido e conta a pagar gerada.');
      router.push('/compras');
    } catch { /* aviso já exibido */ }
  }

  const usados = new Set(linhas.map((l) => l.produtoId).filter(Boolean));

  return (
    <>
      <Link href="/compras" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" />Compras</Link>
      <PageHeader titulo="Nova compra" descricao="Ao salvar, os itens entram no estoque e a conta a pagar é criada. Se algo falhar, nada é gravado." />
      <form onSubmit={enviar} noValidate className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader titulo="Itens comprados" />
            <CardBody className="space-y-3">
              {linhas.map((l, i) => (
                <div key={l.chave} className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-[1fr_6rem_8rem_auto] sm:items-end">
                  <SearchSelect rotulo={i === 0 ? 'Produto' : undefined} opcoes={(produtos.data ?? []).filter((p) => String(p.id) === l.produtoId || !usados.has(String(p.id))).map((p) => ({ valor: p.id, rotulo: p.nome, detalhe: p.sku }))} valor={l.produtoId} onChange={(v) => mudar(l.chave, 'produtoId', v)} carregando={produtos.isPending} placeholder="Buscar produto…" />
                  <Input rotulo={i === 0 ? 'Quantidade' : undefined} aria-label="Quantidade" inputMode="decimal" value={l.quantidade} onChange={(e) => mudar(l.chave, 'quantidade', e.target.value)} />
                  <Input rotulo={i === 0 ? 'Custo unitário (R$)' : undefined} aria-label="Custo unitário" inputMode="decimal" placeholder="0,00" value={l.valorUnitario} onChange={(e) => mudar(l.chave, 'valorUnitario', e.target.value)} dica={subtotais[i] ? brl(subtotais[i]) : undefined} />
                  <Button variante="ghost" tamanho="icon" aria-label="Remover item" disabled={linhas.length === 1} onClick={() => setLinhas((ls) => ls.filter((x) => x.chave !== l.chave))}><Trash2 className="size-4 text-danger" /></Button>
                </div>
              ))}
              {erros.itens && <p role="alert" className="text-xs text-danger">{erros.itens}</p>}
              <Button variante="outline" tamanho="sm" icone={<Plus className="size-4" />} onClick={() => setLinhas((ls) => [...ls, nova()])}>Adicionar produto</Button>
            </CardBody>
          </Card>
          <Card>
            <button type="button" onClick={() => setComNota((v) => !v)} aria-expanded={comNota} className="flex w-full items-center justify-between px-5 py-4 text-left">
              <span><span className="block text-sm font-semibold">Nota de entrada <span className="font-normal text-muted">(opcional)</span></span><span className="block text-xs text-muted">Registre número, série e chave apenas como referência da compra.</span></span>
              <ChevronDown className={`size-4 text-muted transition ${comNota ? 'rotate-180' : ''}`} />
            </button>
            {comNota && (
              <CardBody className="grid gap-4 border-t border-line sm:grid-cols-3">
                <Input rotulo="Número" inputMode="numeric" value={nota.numero} onChange={(e) => setNota({ ...nota, numero: soDigitos(e.target.value).slice(0, 9) })} />
                <Input rotulo="Série" inputMode="numeric" value={nota.serie} onChange={(e) => setNota({ ...nota, serie: soDigitos(e.target.value).slice(0, 3) })} />
                <Input rotulo="Emissão" type="date" value={nota.dataEmissao} onChange={(e) => setNota({ ...nota, dataEmissao: e.target.value })} />
                <Input className="sm:col-span-3" rotulo="Chave de acesso (44 dígitos)" inputMode="numeric" value={nota.chave} onChange={(e) => setNota({ ...nota, chave: soDigitos(e.target.value).slice(0, 44) })} erro={erros.nota} />
              </CardBody>
            )}
          </Card>
          <Card><CardHeader titulo="Observações" /><CardBody><Textarea aria-label="Observações" value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Opcional" /></CardBody></Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardHeader titulo="Dados da compra" />
            <CardBody className="space-y-4">
              <SearchSelect rotulo="Fornecedor" obrigatorio opcoes={(fornecedores.data ?? []).map((f) => ({ valor: f.id, rotulo: f.pessoa.nome, detalhe: f.pessoa.email }))} valor={fornecedorId} onChange={setFornecedorId} carregando={fornecedores.isPending} placeholder="Buscar fornecedor…" erro={erros.fornecedor} dica={!fornecedores.isPending && !fornecedores.data?.length ? 'Cadastre um fornecedor na aba Fornecedores.' : undefined} />
              <Select rotulo="Entrada no estoque de" obrigatorio value={almoxEscolhido} onChange={(e) => setAlmoxId(e.target.value)} erro={erros.almox}>
                {ativos.length === 0 && <option value="">Nenhum almoxarifado ativo</option>}{ativos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </Select>
              <Input rotulo="Referência" obrigatorio value={referencia} onChange={(e) => setReferencia(e.target.value)} maxLength={100} erro={erros.referencia} />
              <Input rotulo="Vencimento do pagamento" obrigatorio type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} erro={erros.vencimento} />
              {ler('financeiro') && <Select rotulo="Forma de pagamento" value={formaId} onChange={(e) => setFormaId(e.target.value)}><option value="">Não informada</option>{formas.data?.filter((f) => f.ativo).map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}</Select>}
              <div className="grid grid-cols-2 gap-3"><Input rotulo="Acréscimos (R$)" inputMode="decimal" value={acrescimos} onChange={(e) => setAcrescimos(e.target.value)} placeholder="0,00" /><Input rotulo="Desconto (R$)" inputMode="decimal" value={desconto} onChange={(e) => setDesconto(e.target.value)} placeholder="0,00" /></div>
            </CardBody>
          </Card>
          <Card className="p-5">
            <div className="flex items-baseline justify-between"><span className="text-sm text-muted">Total a pagar</span><span className="num text-2xl font-semibold tracking-tight">{brl(Math.max(total, 0))}</span></div>
            <Button type="submit" tamanho="lg" className="mt-4 w-full" carregando={criar.isPending}>Registrar compra</Button>
          </Card>
        </div>
      </form>
    </>
  );
}
