# Revisão do passo 4 contra o PDF

Registro histórico anterior ao passo 5. A geração de IDs também foi substituída posteriormente; consulte [IDs incrementais](ids-incrementais.md). A autenticação descrita como pendente abaixo foi implementada posteriormente; consulte [autenticação e permissões](autenticacao.md) para o estado atual.

Referência: `ERP_Mateus_Victor-2.pdf`, justificativa (p. 13), objetivos (seção 3.2) e segurança (seção 4.6). O PDF permanece inalterado.

## Correções desta revisão

- Pedido usa o preço padrão cadastrado e recusa venda abaixo do custo. A justificativa trata de margem desconhecida e vendas com prejuízo; o bloqueio explícito é a regra solicitada nesta revisão, não uma exigência literal do PDF.
- `ItemPedido.custoUnitario` preserva o custo cadastrado no momento da venda. Indicadores de margem ainda serão implementados.
- Referência opcional com geração automática de UUID; referências fornecidas continuam únicas por empresa.
- Proteção contra desativação do status inicial. O PATCH já permitia reativar; não era necessário criar essa capacidade. Um novo status inicial pode ser cadastrado, substituindo o anterior.
- Baseline SQL gerado por `prisma migrate diff`, sem DDL artesanal, e `.gitattributes` com normalização de texto.

## Limites e etapas restantes

| Assunto | Estado atual |
| --- | --- |
| Pedido, estoque e receita | Integrados na mesma transação; status configuráveis por empresa |
| Cancelamento | Apenas pedido aberto com receita não recebida; finalizados não cancelam. Devolução e estorno financeiro não implementados |
| Alerta mínimo | Retornado na operação e disponível em `GET /estoque/alertas`; sem histórico persistido ou entrega dirigida ao gestor. Exibição ao gestor fica para o dashboard e permissões |
| Segurança | Guard de desenvolvimento; JWT, refresh token, hash de senha e autorização por departamento continuam pendentes do passo 5. A afirmação da seção 4.6 ainda não descreve a implementação atual |
| Indicadores | Fluxo de caixa disponível. Ticket médio, ranking de produtos e margem, junto ao painel, ficam para o passo 6 |
| Compras | Entrada manual de mercadoria com conta a pagar, mantida conforme solicitação anterior. Dados de nota são metadados manuais; sem emissão fiscal ou importação XML |

Isolamento de dados por empresa no banco e nas consultas não substitui autenticação: os cabeçalhos de desenvolvimento não comprovam a identidade do usuário.

## Banco e validação

Migration inicial: `prisma/migrations/20261020000000_inicial/migration.sql`. Inclui o schema completo atual e o custo do item. Destinada a banco novo, sem dados prévios.

Após configurar `DATABASE_URL` para o banco de desenvolvimento, execute:

```powershell
npm.cmd run prisma:migrate
npm.cmd run prisma:generate
npm.cmd run seed:dev
```

Para aplicar apenas as migrations já versionadas em banco novo, use `npm.cmd run prisma:deploy`. Não marque o baseline como aplicado em um banco antigo: primeiro compare o schema, pois a coluna de custo histórico não existia. Não use reset em banco com dados.

Nesta revisão: schema validado, Prisma Client gerado, build concluído e 29 testes aprovados. Os testes de preço incluem adulteração, ausência, valor abaixo/igual ao custo e preservação do custo histórico. As verificações de rollback usam repositório em memória.

O comando `prisma migrate dev --create-only` foi tentado, mas falhou por ausência de `DATABASE_URL`. Nenhuma migration foi aplicada aqui. Os testes em PostgreSQL 16 relatados na análise recebida são evidência externa; não foram reproduzidos nesta sessão e antecedem estas correções.
