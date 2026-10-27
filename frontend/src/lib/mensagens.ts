// O backend valida com class-validator e devolve mensagens em inglês ("email must be an email").
// Aqui elas viram frases claras em português, citando o campo pelo nome que o usuário conhece.
const ROTULOS: Record<string, string> = {
  nome: 'Nome', email: 'E-mail', cpfCnpj: 'CPF/CNPJ', telefone: 'Telefone', endereco: 'Endereço', tipo: 'Tipo',
  sku: 'SKU', descricao: 'Descrição', referencia: 'Referência', cor: 'Cor', precoCusto: 'Preço de custo',
  precoVenda: 'Preço de venda', estoqueMinimo: 'Estoque mínimo', categoriaId: 'Categoria',
  unidadeMedidaId: 'Unidade de medida', marcaId: 'Marca', quantidade: 'Quantidade', observacao: 'Observação',
  produtoId: 'Produto', almoxarifadoId: 'Almoxarifado', clienteId: 'Cliente', fornecedorId: 'Fornecedor',
  dataVencimento: 'Vencimento', dataInicio: 'Data inicial', dataFim: 'Data final', valor: 'Valor',
  valorUnitario: 'Valor unitário', formaPagamentoId: 'Forma de pagamento', planoContasId: 'Plano de contas',
  centroCustoId: 'Centro de custo', statusId: 'Status', itens: 'Itens', username: 'Usuário', senha: 'Senha',
  senhaAtual: 'Senha atual', novaSenha: 'Nova senha', cnpj: 'CNPJ', codigo: 'Código', sigla: 'Sigla',
  departamentoId: 'Departamento', permissoes: 'Permissões', acrescimos: 'Acréscimos', desconto: 'Desconto',
  numero: 'Número', serie: 'Série', dataEmissao: 'Data de emissão', chave: 'Chave de acesso',
};

function rotuloDe(caminho: string): string {
  const partes = caminho.split('.');
  const folha = ROTULOS[partes[partes.length - 1]] ?? partes[partes.length - 1];
  const indice = partes.findIndex((p) => /^\d+$/.test(p));
  return indice >= 0 ? `Item ${Number(partes[indice]) + 1} · ${folha}` : folha;
}

const REGRAS: [RegExp, (campo: string, m: RegExpMatchArray) => string][] = [
  [/^(\S+) should not be empty$/, (c) => `Preencha o campo "${rotuloDe(c)}".`],
  [/^(\S+) must be an email$/, () => 'Informe um e-mail válido.'],
  [/^(\S+) must be an integer number/, (c) => `Selecione uma opção válida em "${rotuloDe(c)}".`],
  [/^(\S+) must not be less than (\S+)$/, (c, m) => `"${rotuloDe(c)}": o valor mínimo é ${m[2]}.`],
  [/^(\S+) must not be greater than (\S+)$/, (c, m) => `"${rotuloDe(c)}": o valor máximo é ${m[2]}.`],
  [/^(\S+) must be a number/, (c) => `"${rotuloDe(c)}": informe um número válido.`],
  [/^(\S+) must be a string$/, (c) => `"${rotuloDe(c)}": texto inválido.`],
  [/^(\S+) must be longer than or equal to (\d+) characters$/, (c, m) => `"${rotuloDe(c)}": mínimo de ${m[2]} caracteres.`],
  [/^(\S+) must be shorter than or equal to (\d+) characters$/, (c, m) => `"${rotuloDe(c)}": máximo de ${m[2]} caracteres.`],
  [/^(\S+) must be one of the following values/, (c) => `Selecione uma opção válida em "${rotuloDe(c)}".`],
  [/^(\S+) must match .* regular expression$/, (c) => `"${rotuloDe(c)}": formato inválido.`],
  [/^(\S+) must contain at least (\d+) elements$/, (c) => `Adicione ao menos um item em "${rotuloDe(c)}".`],
  [/^property (\S+) should not exist$/, (c) => `O campo "${rotuloDe(c)}" não é aceito nesta operação.`],
];

export function traduzirMensagem(texto: string): string {
  for (const [regra, montar] of REGRAS) {
    const m = texto.match(regra);
    if (m) return montar(m[1], m);
  }
  return texto;
}

export function traduzirMensagens(entrada: unknown): string[] {
  const lista = Array.isArray(entrada) ? entrada : entrada ? [entrada] : [];
  return lista.map((m) => traduzirMensagem(String(m)));
}
