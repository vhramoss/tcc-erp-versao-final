'use client';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { FormModal, type CampoSimples } from '@/components/domain/form-modal';
import { Badge, Button, Card, CardHeader, DataTable, toast } from '@/components/ui';
import { useCan } from '@/lib/use-auth';
import { useCentrosCusto, useCriarCentro, useCriarForma, useCriarPlano, useFormasPagamento, usePlanosContas } from './api';

type Qual = 'plano' | 'centro' | 'forma';

export function Tesouraria() {
  const { gerenciar } = useCan();
  const podeEditar = gerenciar('financeiro');
  const planos = usePlanosContas(), centros = useCentrosCusto(), formas = useFormasPagamento();
  const criarPlano = useCriarPlano(), criarCentro = useCriarCentro(), criarForma = useCriarForma();
  const [qual, setQual] = useState<Qual | null>(null);

  const forms: Record<Qual, { titulo: string; campos: CampoSimples[]; salvar: (v: Record<string, string>) => Promise<unknown> }> = {
    plano: { titulo: 'Novo plano de contas', campos: [
      { chave: 'codigo', rotulo: 'Código', placeholder: 'Ex.: 1.1.01', obrigatorio: true },
      { chave: 'nome', rotulo: 'Nome', placeholder: 'Ex.: Receita de vendas', obrigatorio: true },
      { chave: 'tipo', rotulo: 'Tipo', padrao: 'RECEITA', opcoes: [{ valor: 'RECEITA', rotulo: 'Receita' }, { valor: 'DESPESA', rotulo: 'Despesa' }] }], salvar: (v) => criarPlano.mutateAsync({ codigo: v.codigo, nome: v.nome, tipo: v.tipo }) },
    centro: { titulo: 'Novo centro de custo', campos: [{ chave: 'nome', rotulo: 'Nome', placeholder: 'Ex.: Comercial', obrigatorio: true }], salvar: (v) => criarCentro.mutateAsync({ nome: v.nome }) },
    forma: { titulo: 'Nova forma de pagamento', campos: [{ chave: 'nome', rotulo: 'Nome', placeholder: 'Ex.: Pix, Cartão 3x, Boleto', obrigatorio: true }], salvar: (v) => criarForma.mutateAsync({ nome: v.nome }) },
  };
  const botao = (q: Qual, rotulo: string) => podeEditar && <Button tamanho="sm" variante="outline" icone={<Plus className="size-4" />} onClick={() => setQual(q)}>{rotulo}</Button>;

  return (
    <>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card className="xl:col-span-2">
          <CardHeader titulo="Plano de contas" descricao="Classifica receitas e despesas para entender para onde o dinheiro vai." acao={botao('plano', 'Nova conta')} />
          <DataTable colunas={[
            { chave: 'c', titulo: 'Código', render: (p) => <span className="num font-medium">{p.codigo}</span> },
            { chave: 'n', titulo: 'Nome', render: (p) => p.nome },
            { chave: 't', titulo: 'Tipo', render: (p) => (p.tipo === 'RECEITA' ? <Badge tom="sucesso">Receita</Badge> : <Badge tom="perigo">Despesa</Badge>) },
          ]} linhas={planos.data} chaveLinha={(p) => p.id} carregando={planos.isPending} erro={planos.error?.message} vazio={{ titulo: 'Nenhuma conta', descricao: 'Crie contas como "Receita de vendas" e "Aluguel".' }} />
        </Card>
        <Card>
          <CardHeader titulo="Centros de custo" descricao="Áreas do negócio que geram ou consomem dinheiro." acao={botao('centro', 'Novo centro')} />
          <DataTable colunas={[{ chave: 'n', titulo: 'Nome', render: (c) => <span className="font-medium">{c.nome}</span> }]} linhas={centros.data} chaveLinha={(c) => c.id} carregando={centros.isPending} erro={centros.error?.message} vazio={{ titulo: 'Nenhum centro de custo' }} />
        </Card>
        <Card>
          <CardHeader titulo="Formas de pagamento" descricao="Como o dinheiro entra e sai." acao={botao('forma', 'Nova forma')} />
          <DataTable colunas={[{ chave: 'n', titulo: 'Nome', render: (f) => <span className="font-medium">{f.nome}</span> }, { chave: 'a', titulo: 'Situação', render: (f) => (f.ativo ? <Badge tom="sucesso">Ativa</Badge> : <Badge>Inativa</Badge>) }]} linhas={formas.data} chaveLinha={(f) => f.id} carregando={formas.isPending} erro={formas.error?.message} vazio={{ titulo: 'Nenhuma forma de pagamento' }} />
        </Card>
      </div>
      {qual && <FormModal aberto onFechar={() => setQual(null)} titulo={forms[qual].titulo} campos={forms[qual].campos} rotuloSalvar="Criar" onSubmit={async (v) => { await forms[qual].salvar(v); toast.sucesso('Cadastro criado.'); }} />}
    </>
  );
}
