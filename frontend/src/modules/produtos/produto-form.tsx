'use client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button, Input, Modal, Select, Switch } from '@/components/ui';
import { arredondar, lerDecimal, percentual } from '@/lib/format';
import { toast } from '@/components/ui';
import { useCategorias, useCriarProduto, useMarcas, useUnidades } from './api';

const VAZIO = { nome: '', sku: '', descricao: '', referencia: '', cor: '', precoCusto: '', precoVenda: '', estoqueMinimo: '0', categoriaId: '', unidadeMedidaId: '', marcaId: '', alertaEstoqueAtivo: true };

export function ProdutoFormModal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const [f, setF] = useState(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});
  const categorias = useCategorias(), marcas = useMarcas(), unidades = useUnidades();
  const criar = useCriarProduto();

  useEffect(() => { if (aberto) { setF(VAZIO); setErros({}); } }, [aberto]);
  const mudar = (campo: keyof typeof VAZIO) => (valor: string | boolean) => setF((a) => ({ ...a, [campo]: valor }));

  const custo = lerDecimal(f.precoCusto), venda = lerDecimal(f.precoVenda);
  const margem = useMemo(() => (venda > 0 && custo >= 0 ? ((venda - custo) / venda) * 100 : null), [custo, venda]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const novo: Record<string, string> = {};
    if (!f.nome.trim()) novo.nome = 'Informe o nome.';
    if (!f.sku.trim()) novo.sku = 'Informe o SKU.';
    if (Number.isNaN(custo) || custo < 0) novo.precoCusto = 'Informe o custo.';
    if (Number.isNaN(venda) || venda <= 0) novo.precoVenda = 'Informe o preço de venda.';
    else if (!Number.isNaN(custo) && venda < custo) novo.precoVenda = 'O preço de venda não pode ser menor que o custo.';
    const minimo = lerDecimal(f.estoqueMinimo);
    if (Number.isNaN(minimo) || minimo < 0) novo.estoqueMinimo = 'Informe um número (0 ou mais).';
    if (!f.categoriaId) novo.categoriaId = 'Selecione a categoria.';
    if (!f.unidadeMedidaId) novo.unidadeMedidaId = 'Selecione a unidade.';
    setErros(novo);
    if (Object.keys(novo).length) return;

    try {
      await criar.mutateAsync({
        nome: f.nome.trim(), sku: f.sku.trim(), descricao: f.descricao.trim() || undefined, referencia: f.referencia.trim() || undefined, cor: f.cor.trim() || undefined,
        precoCusto: arredondar(custo), precoVenda: arredondar(venda), estoqueMinimo: arredondar(minimo, 3), alertaEstoqueAtivo: f.alertaEstoqueAtivo,
        categoriaId: Number(f.categoriaId), unidadeMedidaId: Number(f.unidadeMedidaId), marcaId: Number(f.marcaId) || undefined,
      });
      toast.sucesso('Produto cadastrado.');
      onFechar();
    } catch { /* aviso já exibido */ }
  }

  const semCadastros = !categorias.isPending && !unidades.isPending && (!categorias.data?.length || !unidades.data?.length);

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Novo produto" descricao="O preço de venda cadastrado aqui é o usado nos pedidos." tamanho="lg"
      rodape={<><Button variante="outline" onClick={onFechar} disabled={criar.isPending}>Cancelar</Button><Button type="submit" form="form-produto" carregando={criar.isPending}>Cadastrar produto</Button></>}>
      {semCadastros && (
        <p className="mb-4 rounded-lg bg-warning-soft px-3 py-2.5 text-xs text-warning">Antes de cadastrar produtos, crie ao menos uma <strong>categoria</strong> e uma <strong>unidade de medida</strong> nas abas correspondentes.</p>
      )}
      <form id="form-produto" onSubmit={enviar} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Input className="sm:col-span-2" rotulo="Nome" obrigatorio value={f.nome} onChange={(e) => mudar('nome')(e.target.value)} erro={erros.nome} />
        <Input rotulo="SKU (código interno)" obrigatorio value={f.sku} onChange={(e) => mudar('sku')(e.target.value)} erro={erros.sku} />
        <Input rotulo="Referência" value={f.referencia} onChange={(e) => mudar('referencia')(e.target.value)} />
        <Select rotulo="Categoria" obrigatorio value={f.categoriaId} onChange={(e) => mudar('categoriaId')(e.target.value)} erro={erros.categoriaId}>
          <option value="">Selecione…</option>{categorias.data?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </Select>
        <Select rotulo="Unidade de medida" obrigatorio value={f.unidadeMedidaId} onChange={(e) => mudar('unidadeMedidaId')(e.target.value)} erro={erros.unidadeMedidaId}>
          <option value="">Selecione…</option>{unidades.data?.map((u) => <option key={u.id} value={u.id}>{u.sigla} — {u.nome}</option>)}
        </Select>
        <Select rotulo="Marca" value={f.marcaId} onChange={(e) => mudar('marcaId')(e.target.value)}>
          <option value="">Sem marca</option>{marcas.data?.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </Select>
        <Input rotulo="Cor" value={f.cor} onChange={(e) => mudar('cor')(e.target.value)} />
        <Input rotulo="Preço de custo (R$)" obrigatorio inputMode="decimal" placeholder="0,00" value={f.precoCusto} onChange={(e) => mudar('precoCusto')(e.target.value)} erro={erros.precoCusto} />
        <Input rotulo="Preço de venda (R$)" obrigatorio inputMode="decimal" placeholder="0,00" value={f.precoVenda} onChange={(e) => mudar('precoVenda')(e.target.value)} erro={erros.precoVenda}
          dica={margem !== null ? `Margem bruta de ${percentual(margem)}` : undefined} />
        <Input rotulo="Estoque mínimo" inputMode="decimal" value={f.estoqueMinimo} onChange={(e) => mudar('estoqueMinimo')(e.target.value)} erro={erros.estoqueMinimo} dica="Abaixo disso o sistema avisa para repor." />
        <div className="flex items-end pb-1"><Switch rotulo="Alertar estoque mínimo" descricao="Desative para itens sem reposição." valor={f.alertaEstoqueAtivo} onChange={mudar('alertaEstoqueAtivo')} /></div>
        <Input className="sm:col-span-2" rotulo="Descrição" value={f.descricao} onChange={(e) => mudar('descricao')(e.target.value)} />
      </form>
    </Modal>
  );
}
