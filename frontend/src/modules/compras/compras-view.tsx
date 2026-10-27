'use client';
import { Plus, Truck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { LinhaInfo } from '@/components/domain/linha-info';
import { PessoaFormModal } from '@/components/domain/pessoa-form';
import { StatusFinanceiroBadge } from '@/components/domain/status-badges';
import { Badge, Button, Card, DataTable, Modal, PageHeader, Skeleton, Tabs, toast, useAba, type Coluna } from '@/components/ui';
import { brl, dataBR, dataHoraBR, mascaraDocumento, numero, paraNumero } from '@/lib/format';
import { useCan } from '@/lib/use-auth';
import { useProdutos } from '@/modules/produtos/api';
import { useCompra, useCompras, useCriarFornecedor, useFornecedores } from './api';
import type { Compra, Fornecedor } from './types';

const ABAS = ['compras', 'fornecedores'];

export function ComprasView() {
  const { gerenciar } = useCan();
  const podeEditar = gerenciar('compras');
  const [aba, setAba] = useAba('compras', ABAS);
  const [detalhe, setDetalhe] = useState<number | null>(null);
  const [novoFornecedor, setNovoFornecedor] = useState(false);
  const compras = useCompras(), fornecedores = useFornecedores();
  const criarFornecedor = useCriarFornecedor();

  const colunasCompra: Coluna<Compra>[] = [
    { chave: 'r', titulo: 'Compra', render: (c) => <div className="min-w-0"><p className="max-w-[14rem] truncate font-medium">{c.referencia}</p><p className="text-xs text-muted">{dataBR(c.createdAt)}</p></div> },
    { chave: 'f', titulo: 'Fornecedor', render: (c) => <span className="block max-w-[16rem] truncate">{c.fornecedor.pessoa.nome}</span> },
    { chave: 'n', titulo: 'Nota', ocultarAte: 'md', render: (c) => (c.notaNumero ? <span className="num text-muted">{c.notaNumero}/{c.notaSerie}</span> : <span className="text-muted">—</span>) },
    { chave: 'v', titulo: 'Total', alinhar: 'right', render: (c) => <span className="num font-semibold">{brl(c.valorTotal)}</span> },
    { chave: 's', titulo: 'Pagamento', render: (c) => (c.financeiro ? <StatusFinanceiroBadge status={c.financeiro.status} tipo="DESPESA" vencimento={c.financeiro.dataVencimento} /> : <span className="text-muted">—</span>) },
  ];
  const colunasFornecedor: Coluna<Fornecedor>[] = [
    { chave: 'n', titulo: 'Fornecedor', render: (f) => <div className="min-w-0"><p className="truncate font-medium">{f.pessoa.nome}</p><p className="truncate text-xs text-muted">{f.pessoa.email}</p></div> },
    { chave: 'd', titulo: 'Documento', ocultarAte: 'sm', render: (f) => <span className="num text-muted">{mascaraDocumento(f.pessoa.cpfCnpj)}</span> },
    { chave: 't', titulo: 'Telefone', ocultarAte: 'md', render: (f) => <span className="text-muted">{f.pessoa.telefone || '—'}</span> },
  ];

  return (
    <>
      <PageHeader titulo="Compras" descricao="Entrada de mercadoria: abastece o estoque e gera a conta a pagar de uma vez."
        acoes={podeEditar && (aba === 'compras'
          ? <Link href="/compras/nova"><Button icone={<Plus className="size-4" />}>Nova compra</Button></Link>
          : <Button icone={<Plus className="size-4" />} onClick={() => setNovoFornecedor(true)}>Novo fornecedor</Button>)} />
      <Tabs ativa={aba} onChange={setAba} abas={[{ chave: 'compras', rotulo: 'Compras', contagem: compras.data?.length }, { chave: 'fornecedores', rotulo: 'Fornecedores', contagem: fornecedores.data?.length }]} />
      {aba === 'compras' && (
        <Card>
          <DataTable colunas={colunasCompra} linhas={compras.data} chaveLinha={(c) => c.id} carregando={compras.isPending} erro={compras.error?.message} onRetry={() => compras.refetch()} aoClicar={(c) => setDetalhe(c.id)}
            vazio={{ titulo: 'Nenhuma compra registrada', descricao: 'Registre uma compra para dar entrada no estoque e provisionar o pagamento.', acao: podeEditar ? <Link href="/compras/nova"><Button icone={<Truck className="size-4" />}>Registrar compra</Button></Link> : undefined }} />
        </Card>
      )}
      {aba === 'fornecedores' && (
        <Card>
          <DataTable colunas={colunasFornecedor} linhas={fornecedores.data} chaveLinha={(f) => f.id} carregando={fornecedores.isPending} erro={fornecedores.error?.message} onRetry={() => fornecedores.refetch()} vazio={{ titulo: 'Nenhum fornecedor', descricao: 'Cadastre fornecedores para registrar compras.' }} />
        </Card>
      )}
      <CompraDetalhe id={detalhe} onFechar={() => setDetalhe(null)} />
      <PessoaFormModal aberto={novoFornecedor} onFechar={() => setNovoFornecedor(false)} titulo="Novo fornecedor" rotuloSalvar="Cadastrar" onSalvar={async (d) => { await criarFornecedor.mutateAsync(d); toast.sucesso('Fornecedor cadastrado.'); }} />
    </>
  );
}

function CompraDetalhe({ id, onFechar }: { id: number | null; onFechar: () => void }) {
  const q = useCompra(id);
  const produtos = useProdutos(!!id);
  const nome = new Map((produtos.data ?? []).map((p) => [p.id, p.nome]));
  const c = q.data;
  return (
    <Modal aberto={!!id} onFechar={onFechar} titulo={c ? `Compra ${c.referencia}` : 'Compra'} descricao={c ? `${c.fornecedor.pessoa.nome} · ${dataHoraBR(c.createdAt)}` : undefined} tamanho="lg">
      {q.isPending ? <Skeleton className="h-40 w-full" /> : q.error || !c ? <p className="py-8 text-center text-sm text-danger">{q.error?.message ?? 'Compra não encontrada.'}</p> : (
        <div className="space-y-5">
          <DataTable<NonNullable<Compra['itens']>[number]> colunas={[
            { chave: 'p', titulo: 'Produto', render: (i) => <span className="font-medium">{nome.get(i.produtoId) ?? 'Produto'}</span> },
            { chave: 'q', titulo: 'Qtd.', alinhar: 'right', render: (i) => <span className="num">{numero(i.quantidade, 3)}</span> },
            { chave: 'u', titulo: 'Unitário', alinhar: 'right', render: (i) => <span className="num text-muted">{brl(i.valorUnitario)}</span> },
            { chave: 't', titulo: 'Total', alinhar: 'right', render: (i) => <span className="num font-semibold">{brl(i.valorTotal)}</span> },
          ]} linhas={c.itens} chaveLinha={(i) => i.id} />
          <dl className="divide-y divide-line rounded-xl border border-line px-4">
            {paraNumero(c.acrescimos) > 0 && <LinhaInfo rotulo="Acréscimos">{brl(c.acrescimos)}</LinhaInfo>}
            {paraNumero(c.desconto) > 0 && <LinhaInfo rotulo="Desconto">− {brl(c.desconto)}</LinhaInfo>}
            <LinhaInfo rotulo="Total da compra"><span className="num text-base font-semibold">{brl(c.valorTotal)}</span></LinhaInfo>
            {c.financeiro && <LinhaInfo rotulo="Pagamento"><span className="inline-flex items-center gap-2"><StatusFinanceiroBadge status={c.financeiro.status} tipo="DESPESA" vencimento={c.financeiro.dataVencimento} />vence {dataBR(c.financeiro.dataVencimento)}</span></LinhaInfo>}
            {c.notaNumero && <LinhaInfo rotulo="Nota de entrada"><Badge>{c.notaNumero}/{c.notaSerie}</Badge> {c.notaEmissao && <span className="text-muted">emitida em {dataBR(c.notaEmissao)}</span>}</LinhaInfo>}
          </dl>
          {c.observacao && <p className="rounded-lg bg-surface-2 p-3 text-xs text-muted">{c.observacao}</p>}
        </div>
      )}
    </Modal>
  );
}
