'use client';
import { AlertTriangle, ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { LinhaInfo } from '@/components/domain/linha-info';
import { StatusFinanceiroBadge, StatusPedidoBadge } from '@/components/domain/status-badges';
import { Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, DataTable, ErrorState, Modal, PageHeader, Select, Skeleton, toast, type Coluna } from '@/components/ui';
import { brl, dataBR, dataHoraBR, numero, paraNumero } from '@/lib/format';
import { useCan } from '@/lib/use-auth';
import { useAlmoxarifados } from '@/modules/estoque/api';
import { useDarBaixa } from '@/modules/financeiro/api';
import { useAlterarStatusItem, useAlterarStatusPedido, usePedido, useStatusPedidos, useStatusProdutos } from './api';
import type { ItemPedido, StatusPedido } from './types';

export function PedidoDetalhe({ id }: { id: number }) {
  const { gerenciar, ler, verCustos } = useCan();
  const q = usePedido(id);
  const statusPedidos = useStatusPedidos();
  const statusItens = useStatusProdutos();
  const almox = useAlmoxarifados(ler('estoque'));
  const alterar = useAlterarStatusPedido(id);
  const alterarItem = useAlterarStatusItem(id);
  const baixa = useDarBaixa();
  const [trocando, setTrocando] = useState(false);
  const [destino, setDestino] = useState('');
  const [recebendo, setRecebendo] = useState(false);

  const pedido = q.data;
  const opcoes = useMemo(() => (statusPedidos.data ?? []).filter((s) => s.ativo && s.id !== pedido?.statusId), [statusPedidos.data, pedido?.statusId]);
  const escolhido: StatusPedido | undefined = opcoes.find((s) => s.id === Number(destino));
  const nomeAlmox = almox.data?.find((a) => a.id === pedido?.almoxarifadoId)?.nome;

  if (q.isPending) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (q.error || !pedido) return <Card><ErrorState mensagem={q.error?.message ?? 'Pedido não encontrado.'} onRetry={() => q.refetch()} /></Card>;

  const encerrado = pedido.status.ehFinal;
  const fin = pedido.financeiro;
  const podeMudar = gerenciar('pedidos') && !encerrado && opcoes.length > 0;

  const colunas: Coluna<ItemPedido>[] = [
    { chave: 'p', titulo: 'Produto', render: (i) => <div className="min-w-0"><p className="truncate font-medium">{i.produto.nome}</p><p className="text-xs text-muted">{i.produto.sku}</p></div> },
    { chave: 'q', titulo: 'Qtd.', alinhar: 'right', render: (i) => <span className="num">{numero(i.quantidade, 3)}</span> },
    { chave: 'u', titulo: 'Unitário', alinhar: 'right', ocultarAte: 'sm', render: (i) => <span className="num text-muted">{brl(i.valorUnitario)}</span> },
    ...(verCustos ? [{ chave: 'm', titulo: 'Margem', alinhar: 'right' as const, ocultarAte: 'lg' as const, render: (i: ItemPedido) => <span className="num text-muted">{i.custoUnitario !== undefined ? brl(paraNumero(i.valorTotal) - paraNumero(i.custoUnitario) * paraNumero(i.quantidade)) : '—'}</span> }] : []),
    { chave: 't', titulo: 'Total', alinhar: 'right', render: (i) => <span className="num font-semibold">{brl(i.valorTotal)}</span> },
    { chave: 's', titulo: 'Situação do item', render: (i) => (gerenciar('pedidos') && !encerrado
      ? <Select aria-label={`Situação de ${i.produto.nome}`} value={i.statusId ?? ''} disabled={alterarItem.isPending} className="min-w-[9rem]"
          onChange={(e) => alterarItem.mutate({ itemId: i.id, statusId: Number(e.target.value) }, { onSuccess: () => toast.sucesso('Item atualizado.') })}>
          {!i.statusId && <option value="">—</option>}{statusItens.data?.filter((s) => s.ativo || s.id === i.statusId).map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </Select>
      : <Badge>{i.status?.nome ?? '—'}</Badge>) },
  ];

  async function confirmarStatus() {
    if (!escolhido) return;
    try {
      await alterar.mutateAsync(escolhido.id);
      toast.sucesso(escolhido.ehCancelamento ? 'Pedido cancelado' : 'Status atualizado', escolhido.ehCancelamento ? 'Estoque devolvido e lançamento financeiro cancelado.' : undefined);
      setTrocando(false);
      setDestino('');
    } catch { /* aviso já exibido */ }
  }

  async function receber() {
    if (!fin) return;
    try { await baixa.mutateAsync(fin.id); toast.sucesso('Recebimento registrado.'); setRecebendo(false); } catch { setRecebendo(false); }
  }

  return (
    <>
      <Link href="/pedidos" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" />Pedidos</Link>
      <PageHeader titulo={`Pedido ${pedido.referencia}`} descricao={`Criado em ${dataHoraBR(pedido.dataPedido)}`}
        acoes={<><StatusPedidoBadge status={pedido.status} />{podeMudar && <Button onClick={() => { setDestino(''); setTrocando(true); }}>Alterar status</Button>}</>} />

      {encerrado && (
        <div role="status" className="mb-6 flex items-start gap-2.5 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          <Info className="mt-0.5 size-4 shrink-0" />{pedido.status.ehCancelamento ? 'Pedido cancelado: estoque devolvido e lançamento financeiro cancelado. Ele não pode mais ser alterado.' : 'Pedido encerrado: não é possível alterar o status.'}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader titulo="Itens" descricao={`${pedido.itens?.length ?? 0} ${pedido.itens?.length === 1 ? 'produto' : 'produtos'}`} />
          <DataTable colunas={colunas} linhas={pedido.itens} chaveLinha={(i) => i.id} />
          <div className="flex items-center justify-between border-t border-line bg-surface-2/50 px-4 py-3"><span className="text-sm text-muted">Total</span><span className="num text-lg font-semibold">{brl(pedido.valorTotal)}</span></div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader titulo="Pagamento" />
            <CardBody>
              {fin ? (
                <>
                  <div className="mb-3 flex items-center justify-between"><span className="num text-2xl font-semibold tracking-tight">{brl(fin.valor)}</span><StatusFinanceiroBadge status={fin.status} tipo="RECEITA" vencimento={fin.dataVencimento} /></div>
                  <dl className="divide-y divide-line">
                    <LinhaInfo rotulo="Vencimento">{dataBR(fin.dataVencimento)}</LinhaInfo>
                    {fin.dataPagamento && <LinhaInfo rotulo="Recebido em">{dataBR(fin.dataPagamento)}</LinhaInfo>}
                  </dl>
                  {fin.status === 'PENDENTE' && gerenciar('financeiro') && <Button className="mt-4 w-full" icone={<CheckCircle2 className="size-4" />} onClick={() => setRecebendo(true)}>Registrar recebimento</Button>}
                </>
              ) : <p className="text-sm text-muted">Sem lançamento financeiro.</p>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader titulo="Detalhes" />
            <CardBody className="pt-2">
              <dl className="divide-y divide-line">
                <LinhaInfo rotulo="Cliente">{pedido.cliente.pessoa.nome}</LinhaInfo>
                <LinhaInfo rotulo="E-mail">{pedido.cliente.pessoa.email}</LinhaInfo>
                {nomeAlmox && <LinhaInfo rotulo="Estoque de">{nomeAlmox}</LinhaInfo>}
              </dl>
              {pedido.observacao && <p className="mt-3 rounded-lg bg-surface-2 p-3 text-xs text-muted">{pedido.observacao}</p>}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal aberto={trocando} onFechar={() => setTrocando(false)} titulo="Alterar status do pedido" tamanho="sm"
        rodape={<><Button variante="outline" onClick={() => setTrocando(false)} disabled={alterar.isPending}>Voltar</Button><Button variante={escolhido?.ehCancelamento ? 'danger' : 'primary'} disabled={!escolhido} onClick={confirmarStatus} carregando={alterar.isPending}>{escolhido?.ehCancelamento ? 'Cancelar pedido' : 'Confirmar'}</Button></>}>
        <div className="space-y-4">
          <Select rotulo="Novo status" value={destino} onChange={(e) => setDestino(e.target.value)}>
            <option value="">Selecione…</option>{opcoes.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </Select>
          {escolhido?.ehCancelamento && <p className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-xs text-danger"><AlertTriangle className="mt-px size-4 shrink-0" />Cancelar devolve os itens ao estoque e cancela a conta a receber. Não é possível se o valor já foi recebido.</p>}
          {escolhido?.ehFinal && !escolhido.ehCancelamento && <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-xs text-info"><Info className="mt-px size-4 shrink-0" />Este status encerra o pedido; depois dele não haverá novas mudanças.</p>}
        </div>
      </Modal>
      <ConfirmDialog aberto={recebendo} onFechar={() => setRecebendo(false)} titulo="Registrar recebimento" confirmar="Confirmar recebimento" carregando={baixa.isPending} onConfirmar={receber}
        mensagem={<>Confirmar o recebimento de <strong className="text-fg">{brl(fin?.valor)}</strong>? Depois disso o pedido não poderá ser cancelado.</>} />
    </>
  );
}
