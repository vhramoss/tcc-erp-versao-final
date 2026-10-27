# Pedidos de venda — passo 4

O módulo utiliza `Pedido`, `ItemPedido` (equivalente ao PedidoProduto do escopo), `StatusPedido` e `StatusProduto`. Os vínculos do pedido e dos itens usam chaves compostas com `idEmpresa`.

## Criação atômica

`POST /pedidos` grava pedido e itens, baixa estoque com registro dos movimentos e gera uma receita pendente, dentro da mesma transação Prisma. Qualquer erro desfaz todas essas operações. Os valores são calculados no servidor com Decimal; cada item é arredondado para duas casas antes da soma.

```json
{
  "referencia": "VENDA-001",
  "clienteId": 1,
  "almoxarifadoId": 1,
  "dataVencimento": "2026-11-20",
  "itens": [
    { "produtoId": 1, "quantidade": 2 }
  ]
}
```

Use IDs numéricos reais da mesma empresa. Cliente, usuário, produtos, almoxarifado e status precisam estar cadastrados, e o depósito deve ter saldo suficiente. A referência é única por empresa: repetir a criação com a mesma referência retorna conflito, sem duplicar efeitos.

Campos opcionais: `referencia`, `statusId`, `formaPagamentoId`, `planoContasId`, `centroCustoId`, `observacao`; cada item também aceita `statusId`. Sem status explícito, usa o status inicial ativo do pedido e o primeiro status de item ativo por ordem, nome e ID. O status inicial não pode encerrar nem cancelar o pedido. A resposta inclui `alertas` de estoque mínimo, respeitando a opção de monitoramento de cada produto.

O preço vem de `PrecoProduto`, tabela `Padrão`, da mesma empresa. Sem preço cadastrado, com preço não positivo ou inferior a `Produto.precoCusto`, a venda é recusada. `valorUnitario` é opcional na requisição: se enviado, deve coincidir com o cadastro, servindo apenas como confirmação. Não permite desconto ou substituição do preço. O item guarda `custoUnitario` no momento da venda, preservando a base de margem bruta histórica mesmo após mudança do custo cadastrado. Isso não representa custo médio contábil nem lucro líquido.

Sem `referencia`, o servidor gera `PED-000001`, usando o ID incremental do banco (sequência global da tabela, com possíveis intervalos). Para repetir uma requisição com segurança após perda de resposta, informe e reutilize uma referência própria: duas requisições sem referência são duas vendas distintas.

## Consultas e status

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/pedidos` | Listagem com filtros `statusId`, `clienteId`, `dataInicio`, `dataFim`, `page`, `limit` |
| GET | `/pedidos/:id` | Pedido com itens, status, cliente e financeiro |
| PATCH | `/pedidos/:id/status` | Corpo `{ "statusId": 1 }` |
| PATCH | `/pedidos/:id/itens/:itemId/status` | Mesmo corpo, altera o status do item |
| POST/GET | `/pedidos/status/pedido` | Criar/listar status de pedido |
| PATCH | `/pedidos/status/pedido/:id` | Editar nome, ordem e ativo |
| POST/GET | `/pedidos/status/produto` | Criar/listar status dos itens |
| PATCH | `/pedidos/status/produto/:id` | Editar nome, ordem e ativo |

Na criação dos status, informe `nome` e, opcionalmente, `ordem` e `ativo`. Status de pedido também aceita `ehInicial`, `ehFinal` e `ehCancelamento`. Criar um novo inicial remove essa marcação do anterior; cancelamento implica status final. As características inicial/final/cancelamento são definidas na criação, para preservar a interpretação dos pedidos existentes.

O PATCH permite reativar um status com `{ "ativo": true }`. Desativar o status inicial é bloqueado; cadastre primeiro outro status com `ehInicial: true`.

Mudar para um status comum não movimenta estoque nem gera outra receita. Cancelar um pedido aberto devolve os itens ao depósito original e cancela a receita pendente na mesma transação. Uma receita já recebida bloqueia o cancelamento. Repetir o mesmo status não repete os efeitos; pedidos encerrados não podem ser reabertos ou ter status dos itens alterados.

Por decisão de escopo, um pedido finalizado (inclusive “Entregue”) não pode ser cancelado. Devoluções após entrega e estorno de recebimentos não estão implementados.

As requisições exigem `Authorization: Bearer ACCESS_TOKEN` e permissões de pedidos. Consulte [autenticação e permissões](autenticacao.md). Os cabeçalhos temporários de desenvolvimento não autenticam mais.

## Validação

Executar `npm.cmd exec prisma validate`, `npm.cmd exec prisma generate`, `npm.cmd run build` e `npm.cmd test`.

Os testes exercitam os serviços reais com repositório em memória e rollback por snapshot, incluindo falha financeira, estoque insuficiente, isolamento de vínculos, referência repetida e cancelamento. Não substituem testes de transações, locks e constraints em PostgreSQL. O schema foi atualizado; esta etapa não aplicou alterações em banco de dados.
