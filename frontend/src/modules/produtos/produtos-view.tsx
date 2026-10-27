'use client';
import { Package, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormModal, type CampoSimples } from '@/components/domain/form-modal';
import { Badge, Button, Card, DataTable, Input, PageHeader, Tabs, toast, useAba, type Coluna } from '@/components/ui';
import { brl, normalizar, paraNumero, percentual } from '@/lib/format';
import { useCan } from '@/lib/use-auth';
import { useCategorias, useCriarCategoria, useCriarMarca, useCriarUnidade, useMarcas, useProdutos, useUnidades } from './api';
import { ProdutoFormModal } from './produto-form';
import { precoPadrao, type Produto } from './types';

const ABAS = ['produtos', 'categorias', 'marcas', 'unidades'];

export function ProdutosView() {
  const { gerenciar, verCustos } = useCan();
  const podeEditar = gerenciar('produtos');
  const [aba, setAba] = useAba('produtos', ABAS);
  const [novoProduto, setNovoProduto] = useState(false);
  const [simples, setSimples] = useState<null | 'categoria' | 'marca' | 'unidade'>(null);
  const [busca, setBusca] = useState('');

  const produtos = useProdutos(), categorias = useCategorias(), marcas = useMarcas(), unidades = useUnidades();
  const criarCategoria = useCriarCategoria(), criarMarca = useCriarMarca(), criarUnidade = useCriarUnidade();

  const filtrados = useMemo(() => {
    const t = normalizar(busca.trim());
    return (produtos.data ?? []).filter((p) => !t || normalizar(`${p.nome} ${p.sku} ${p.referencia ?? ''} ${p.categoria.nome} ${p.marca?.nome ?? ''}`).includes(t));
  }, [produtos.data, busca]);

  const colunasProduto: Coluna<Produto>[] = [
    { chave: 'nome', titulo: 'Produto', render: (p) => (<div className="min-w-0"><p className="truncate font-medium">{p.nome}</p><p className="truncate text-xs text-muted">{p.sku}{p.cor ? ` · ${p.cor}` : ''}{p.referencia ? ` · ref. ${p.referencia}` : ''}</p></div>) },
    { chave: 'categoria', titulo: 'Categoria', ocultarAte: 'md', render: (p) => <span className="text-muted">{p.categoria.nome}{p.marca ? ` · ${p.marca.nome}` : ''}</span> },
    { chave: 'un', titulo: 'Un.', ocultarAte: 'sm', render: (p) => <Badge>{p.unidadeMedida.sigla}</Badge> },
    ...(verCustos ? [{ chave: 'custo', titulo: 'Custo', alinhar: 'right' as const, ocultarAte: 'lg' as const, render: (p: Produto) => <span className="num text-muted">{p.precoCusto !== undefined ? brl(p.precoCusto) : '—'}</span> }] : []),
    { chave: 'venda', titulo: 'Preço de venda', alinhar: 'right', render: (p) => <span className="num font-medium">{brl(precoPadrao(p))}</span> },
    ...(verCustos ? [{ chave: 'margem', titulo: 'Margem', alinhar: 'right' as const, ocultarAte: 'lg' as const, render: (p: Produto) => {
      const v = paraNumero(precoPadrao(p)), c = paraNumero(p.precoCusto);
      return <span className="num text-muted">{v > 0 && p.precoCusto !== undefined ? percentual(((v - c) / v) * 100) : '—'}</span>;
    } }] : []),
    { chave: 'min', titulo: 'Mín. / alerta', alinhar: 'right', ocultarAte: 'md', render: (p) => (<div className="flex items-center justify-end gap-2"><span className="num text-muted">{paraNumero(p.estoqueMinimo)}</span>{p.alertaEstoqueAtivo ? <Badge tom="marca">Ativo</Badge> : <Badge>Sem alerta</Badge>}</div>) },
  ];

  const config = {
    categoria: { titulo: 'Nova categoria', campos: [{ chave: 'nome', rotulo: 'Nome da categoria', obrigatorio: true }] as CampoSimples[], salvar: (v: Record<string, string>) => criarCategoria.mutateAsync({ nome: v.nome }) },
    marca: { titulo: 'Nova marca', campos: [{ chave: 'nome', rotulo: 'Nome da marca', obrigatorio: true }] as CampoSimples[], salvar: (v: Record<string, string>) => criarMarca.mutateAsync({ nome: v.nome }) },
    unidade: { titulo: 'Nova unidade de medida', campos: [
      { chave: 'sigla', rotulo: 'Sigla', placeholder: 'UN, KG, CX…', obrigatorio: true, transformar: (v: string) => v.toUpperCase().slice(0, 6) },
      { chave: 'nome', rotulo: 'Nome', placeholder: 'Unidade, Quilograma, Caixa…', obrigatorio: true }] as CampoSimples[], salvar: (v: Record<string, string>) => criarUnidade.mutateAsync({ sigla: v.sigla, nome: v.nome }) },
  };
  const atual = simples ? config[simples] : null;

  const botaoNovo = aba === 'produtos'
    ? <Button icone={<Plus className="size-4" />} onClick={() => setNovoProduto(true)}>Novo produto</Button>
    : <Button icone={<Plus className="size-4" />} onClick={() => setSimples(aba === 'categorias' ? 'categoria' : aba === 'marcas' ? 'marca' : 'unidade')}>Nova {aba === 'categorias' ? 'categoria' : aba === 'marcas' ? 'marca' : 'unidade'}</Button>;

  return (
    <>
      <PageHeader titulo="Produtos" descricao="Cadastro de produtos, categorias, marcas e unidades de medida." acoes={podeEditar ? botaoNovo : undefined} />
      <Tabs ativa={aba} onChange={setAba} abas={[
        { chave: 'produtos', rotulo: 'Produtos', contagem: produtos.data?.length },
        { chave: 'categorias', rotulo: 'Categorias', contagem: categorias.data?.length },
        { chave: 'marcas', rotulo: 'Marcas', contagem: marcas.data?.length },
        { chave: 'unidades', rotulo: 'Unidades de medida', contagem: unidades.data?.length },
      ]} />

      {aba === 'produtos' && (
        <Card>
          <div className="border-b border-line p-4"><div className="relative max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input aria-label="Buscar produtos" placeholder="Buscar por nome, SKU, categoria…" value={busca} onChange={(e) => setBusca(e.target.value)} className="[&_input]:pl-9" /></div></div>
          <DataTable colunas={colunasProduto} linhas={filtrados} chaveLinha={(p) => p.id} carregando={produtos.isPending} erro={produtos.error?.message} onRetry={() => produtos.refetch()}
            vazio={{ titulo: busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado', descricao: busca ? 'Tente outro termo de busca.' : 'Cadastre o primeiro produto para começar a vender e controlar o estoque.', acao: !busca && podeEditar ? <Button icone={<Package className="size-4" />} onClick={() => setNovoProduto(true)}>Cadastrar produto</Button> : undefined }} />
        </Card>
      )}
      {aba === 'categorias' && <Card><DataTable colunas={[{ chave: 'nome', titulo: 'Categoria', render: (c) => <span className="font-medium">{c.nome}</span> }]} linhas={categorias.data} chaveLinha={(c) => c.id} carregando={categorias.isPending} erro={categorias.error?.message} vazio={{ titulo: 'Nenhuma categoria', descricao: 'Categorias agrupam produtos parecidos e melhoram os relatórios.' }} /></Card>}
      {aba === 'marcas' && <Card><DataTable colunas={[{ chave: 'nome', titulo: 'Marca', render: (m) => <span className="font-medium">{m.nome}</span> }]} linhas={marcas.data} chaveLinha={(m) => m.id} carregando={marcas.isPending} erro={marcas.error?.message} vazio={{ titulo: 'Nenhuma marca', descricao: 'Marcas são opcionais no cadastro do produto.' }} /></Card>}
      {aba === 'unidades' && <Card><DataTable colunas={[{ chave: 's', titulo: 'Sigla', render: (u) => <Badge tom="marca">{u.sigla}</Badge> }, { chave: 'n', titulo: 'Nome', render: (u) => u.nome }]} linhas={unidades.data} chaveLinha={(u) => u.id} carregando={unidades.isPending} erro={unidades.error?.message} vazio={{ titulo: 'Nenhuma unidade', descricao: 'Crie ao menos uma (ex.: UN, KG) para poder cadastrar produtos.' }} /></Card>}

      <ProdutoFormModal aberto={novoProduto} onFechar={() => setNovoProduto(false)} />
      {atual && <FormModal aberto onFechar={() => setSimples(null)} titulo={atual.titulo} campos={atual.campos} rotuloSalvar="Criar" onSubmit={async (v) => { await atual.salvar(v); toast.sucesso('Cadastro criado.'); }} />}
    </>
  );
}
