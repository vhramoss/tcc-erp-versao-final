# Compras manuais — API

Os módulos estão registrados no NestJS. Exigem `Authorization: Bearer ACCESS_TOKEN`
e permissões de compras; consulte [autenticação](autenticacao.md). Não incluem telas.
A migration inicial está em `prisma/migrations`. Para banco novo, configure
`DATABASE_URL` e execute `npm run prisma:deploy`; em desenvolvimento,
`npm run prisma:migrate` aplica o histórico e verifica mudanças.
Não execute reset em banco com dados. O cliente pode ser atualizado com
`npm run prisma:generate`. Compilação: `npm run build`. Testes: `npm test`.

## Fornecedores

- `POST /fornecedores`: recebe os mesmos campos de cadastro de pessoa:
  `nome`, `email`, `cpfCnpj`, `tipo` (`FISICA` ou `JURIDICA`), e opcionais
  `telefone`/`endereco`. Cria pessoa e fornecedor em transação.
- `POST /fornecedores/vincular`: `{ "pessoaId": 1 }` transforma uma pessoa
  já cadastrada na empresa em fornecedor, sem duplicar o cadastro.
- `GET /fornecedores`: lista os fornecedores da empresa.

## Compra recebida manualmente

`POST /compras` registra a compra, seus itens, entradas no almoxarifado e uma
conta a pagar pendente. Tudo acontece na mesma transação: qualquer falha desfaz
todas as gravações. A compra representa mercadoria já recebida, não pedido de
compra futuro. O cadastro do produto deve existir antes do recebimento.

```json
{
  "referencia": "COMPRA-001",
  "fornecedorId": 1,
  "almoxarifadoId": 1,
  "dataVencimento": "2026-11-10",
  "observacao": "Reposição do estoque",
  "itens": [
    { "produtoId": 1, "quantidade": 10, "valorUnitario": 12.50 }
  ],
  "acrescimos": 5,
  "desconto": 0,
  "nota": {
    "numero": "123",
    "serie": "1",
    "dataEmissao": "2026-10-19"
  }
}
```

`nota`, `observacao`, `acrescimos`, `desconto` e `formaPagamentoId` são opcionais.
Esses campos são apenas metadados digitados manualmente. Não há emissão,
importação de XML ou integração com a SEFAZ. A nota pode incluir `chave` de 44 dígitos. O total é calculado no servidor:
soma dos itens (arredondados a centavos) + acréscimos − desconto.
O preço cadastrado do produto não é alterado automaticamente.

`referencia` deve ser única na empresa. Repetições são rejeitadas com conflito,
assim como chave de NF-e ou fornecedor/número/série já registrados. Reutilize a
mesma referência ao repetir uma requisição cuja resposta se perdeu e consulte
a listagem para confirmar o resultado; não envie uma nova referência.

- `GET /compras`: lista compras com seus fornecedores e contas a pagar.
- `GET /compras/:id`: retorna itens, fornecedor, financeiro e movimentações.
- `PATCH /financeiro/baixa/:id`: registra pagamento usando a rota existente;
  aceita `{ "dataPagamento": "2026-11-10" }`.

Não há cancelamento/devolução de compra neste fluxo. O financeiro vinculado
não pode ser cancelado isoladamente, pois isso deixaria estoque sem contrapartida.

## Estoque inicial e correções manuais

Use `POST /estoque/movimentacao` com `produtoId`, `almoxarifadoId`, `quantidade`,
`tipo` (`ENTRADA` ou `SAIDA`) e `observacao`.

- Estoque inicial: uma entrada da quantidade existente, com observação explicativa.
- Correção: uma entrada ou saída da diferença entre o saldo atual e a contagem física.
- Esses movimentos não geram lançamento financeiro automaticamente.

## Validação

Os testes usam os serviços reais com repositórios em memória. A confirmação de
concorrência e constraints no PostgreSQL requer um banco de teste.
