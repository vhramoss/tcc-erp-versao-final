'use client';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, Input, PageHeader, SearchSelect, Select, Textarea, toast } from '@/components/ui';
import { arredondar, brl, hojeISO, lerDecimal, paraNumero, somarDias } from '@/lib/format';
import { useCan } from '@/lib/use-auth';
import { useClientes } from '@/modules/clientes/api';
import { useAlmoxarifados } from '@/modules/estoque/api';
import { useFormasPagamento } from '@/modules/financeiro/api';
import { useProdutos } from '@/modules/produtos/api';
import { precoPadrao } from '@/modules/produtos/types';
import { useCriarPedido } from './api';

interface Linha { chave: number; produtoId: string; quantidade: string }
let proximaChave = 1;
const novaLinha = (): Linha => ({ chave: proximaChave++, produtoId: '', quantidade: '1' });

export function NovoPedido() {
  const router = useRouter();
  const { ler } = useCan();
  const clientes = useClientes(), produtos = useProdutos(), almox = useAlmoxarifados();
  const formas = useFormasPagamento(ler('financeiro'));
  const criar = useCriarPedido();

  const [clienteId, setClienteId] = useState('');
  const [almoxId, setAlmoxId] = useState('');
  const [formaId, setFormaId] = useState('');
  const [vencimento, setVencimento] = useState(() => somarDias(hojeISO(), 30));
  const [referencia, setReferencia] = useState('');
  const [observacao, setObservacao] = useState('');
  const [linhas, setLinhas] = useState<Linha[]>(() => [novaLinha()]);
  const [erros, setErros] = useState<Record<string, string>>({});

  const ativos = useMemo(() => (almox.data ?? []).filter((a) => a.ativo), [almox.data]);
  const almoxEscolhido = almoxId || ativos[0]?.id || '';
  const porId = useMemo(() => new Map((produtos.data ?? []).map((p) => [p.id, p])), [produtos.data]);

  const detalhe = linhas.map((l) => {
    const p = porId.get(Number(l.produtoId));
    const preco = paraNumero(p && precoPadrao(p));
    const qtd = lerDecimal(l.quantidade);
    return { ...l, produto: p, preco, qtd, subtotal: p && qtd > 0 ? arredondar(preco * qtd) : 0 };
  });
  const total = arredondar(detalhe.reduce((s, l) => s + l.subtotal, 0));

  const mudarLinha = (chave: number, campo: 'produtoId' | 'quantidade', valor: string) => setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, [campo]: valor } : l)));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const novo: Record<string, string> = {};
    if (!clienteId) novo.cliente = 'Selecione o cliente.';
    if (!almoxEscolhido) novo.almox = 'Selecione o almoxarifado.';
    if (!vencimento) novo.vencimento = 'Informe o vencimento.';
    const preenchidas = detalhe.filter((l) => l.produtoId);
    if (preenchidas.length === 0) novo.itens = 'Adicione ao menos um produto.';
    if (preenchidas.some((l) => Number.isNaN(l.qtd) || l.qtd <= 0)) novo.itens = 'Todas as quantidades devem ser maiores que zero.';
    if (preenchidas.some((l) => !(l.preco > 0))) novo.itens = 'Há produto sem preço de venda cadastrado.';
    setErros(novo);
    if (Object.keys(novo).length) return;

    try {
      const pedido = await criar.mutateAsync({
        referencia: referencia.trim() || undefined, clienteId: Number(clienteId), almoxarifadoId: Number(almoxEscolhido), dataVencimento: vencimento,
        formaPagamentoId: Number(formaId) || undefined, observacao: observacao.trim() || undefined,
        itens: preenchidas.map((l) => ({ produtoId: Number(l.produtoId), quantidade: arredondar(l.qtd, 3) })),
      });
      toast.sucesso(`Pedido ${pedido.referencia} criado`, 'Estoque baixado e conta a receber gerada.');
      for (const a of pedido.alertas ?? []) {
        if (a.alerta) toast.aviso('Estoque no mínimo ou abaixo', `${a.mensagem}\nSaldo total: ${a.qtdAtual} · mínimo: ${a.estoqueMinimo}`);
      }
      router.push(`/pedidos/${pedido.id}`);
    } catch { /* aviso já exibido (ex.: saldo insuficiente) */ }
  }

  const usados = new Set(linhas.map((l) => l.produtoId).filter(Boolean));
  const semAcessoAlmox = almox.error && 'status' in almox.error && (almox.error as { status: number }).status === 403;

  return (
    <>
      <Link href="/pedidos" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" />Pedidos</Link>
      <PageHeader titulo="Novo pedido" descricao="Ao salvar, o estoque é baixado e a conta a receber é criada na mesma operação. Se algo falhar, nada é gravado." />
      <form onSubmit={enviar} noValidate className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader titulo="Itens do pedido" descricao="O preço vem do cadastro do produto." />
            <CardBody className="space-y-3">
              {detalhe.map((l, i) => (
                <div key={l.chave} className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-[1fr_7rem_8rem_auto] sm:items-end">
                  <SearchSelect rotulo={i === 0 ? 'Produto' : undefined} aria-label="Produto"
                    opcoes={(produtos.data ?? []).filter((p) => String(p.id) === l.produtoId || !usados.has(String(p.id))).map((p) => ({ valor: p.id, rotulo: p.nome, detalhe: `${p.sku} · ${brl(precoPadrao(p))}` }))}
                    valor={l.produtoId} onChange={(v) => mudarLinha(l.chave, 'produtoId', v)} carregando={produtos.isPending} placeholder="Buscar produto…" />
                  <Input rotulo={i === 0 ? 'Quantidade' : undefined} aria-label="Quantidade" inputMode="decimal" value={l.quantidade} onChange={(e) => mudarLinha(l.chave, 'quantidade', e.target.value)} />
                  <div className="space-y-1.5">
                    {i === 0 && <p className="text-xs font-medium">Subtotal</p>}
                    <div className="flex h-10 flex-col justify-center rounded-lg bg-surface-2 px-3"><span className="num text-sm font-semibold">{brl(l.subtotal)}</span>{l.produto && <span className="num text-[11px] leading-none text-muted">{brl(l.preco)} / {l.produto.unidadeMedida.sigla}</span>}</div>
                  </div>
                  <Button variante="ghost" tamanho="icon" aria-label="Remover item" disabled={linhas.length === 1} onClick={() => setLinhas((ls) => ls.filter((x) => x.chave !== l.chave))}><Trash2 className="size-4 text-danger" /></Button>
                </div>
              ))}
              {erros.itens && <p role="alert" className="text-xs text-danger">{erros.itens}</p>}
              <Button variante="outline" tamanho="sm" icone={<Plus className="size-4" />} onClick={() => setLinhas((ls) => [...ls, novaLinha()])}>Adicionar produto</Button>
            </CardBody>
          </Card>
          <Card>
            <CardHeader titulo="Observações" />
            <CardBody><Textarea aria-label="Observações do pedido" placeholder="Opcional: combinados de entrega, detalhes do cliente…" value={observacao} onChange={(e) => setObservacao(e.target.value)} /></CardBody>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardHeader titulo="Dados do pedido" />
            <CardBody className="space-y-4">
              <SearchSelect rotulo="Cliente" obrigatorio opcoes={(clientes.data ?? []).map((c) => ({ valor: c.id, rotulo: c.pessoa.nome, detalhe: c.pessoa.email }))} valor={clienteId} onChange={setClienteId} carregando={clientes.isPending} placeholder="Buscar cliente…" erro={erros.cliente}
                dica={!clientes.isPending && !clientes.data?.length ? 'Nenhum cliente cadastrado ainda.' : undefined} />
              <Select rotulo="Baixar estoque de" obrigatorio value={almoxEscolhido} onChange={(e) => setAlmoxId(e.target.value)} erro={erros.almox ?? (semAcessoAlmox ? 'Seu perfil precisa de leitura de estoque para escolher o almoxarifado.' : undefined)}>
                {ativos.length === 0 && <option value="">Nenhum almoxarifado ativo</option>}{ativos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </Select>
              <Input rotulo="Vencimento do pagamento" obrigatorio type="date" value={vencimento} min="2000-01-01" onChange={(e) => setVencimento(e.target.value)} erro={erros.vencimento} />
              {ler('financeiro') && (
                <Select rotulo="Forma de pagamento" value={formaId} onChange={(e) => setFormaId(e.target.value)}>
                  <option value="">Não informada</option>{formas.data?.filter((f) => f.ativo).map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </Select>
              )}
              <Input rotulo="Referência" dica="Opcional. Se vazio, o sistema gera uma automaticamente." value={referencia} onChange={(e) => setReferencia(e.target.value)} maxLength={100} />
            </CardBody>
          </Card>
          <Card className="p-5">
            <div className="flex items-baseline justify-between"><span className="text-sm text-muted">Total do pedido</span><span className="num text-2xl font-semibold tracking-tight">{brl(total)}</span></div>
            <p className="mt-1 text-xs text-muted">{detalhe.filter((l) => l.produtoId).length} {detalhe.filter((l) => l.produtoId).length === 1 ? 'item' : 'itens'} · <Badge tom="info">A receber</Badge></p>
            <Button type="submit" tamanho="lg" className="mt-4 w-full" carregando={criar.isPending}>Finalizar pedido</Button>
          </Card>
        </div>
      </form>
    </>
  );
}
