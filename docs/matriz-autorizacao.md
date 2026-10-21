# Matriz de autorização — revisão do passo 5

São 59 rotas explícitas. A matriz esperada está em `test/matriz-autorizacao.json`; o teste compara essa lista com os controllers realmente registrados no `AppModule`. Uma rota nova, removida ou com política diferente faz o teste falhar.

Para cada rota protegida, os guards são testados com ausência de identidade, permissão correta, ausência de permissão e permissão da operação oposta (leitura/escrita). HEAD herda a exigência de leitura das rotas GET. Apenas login e refresh são públicos; refresh ainda exige token válido no serviço. Métodos sem rota registrada não ganham autorização por esta matriz.

## Regras adicionais de concessão

- O usuário não altera suas próprias permissões.
- O gestor não altera permissões do departamento ao qual pertence atualmente no banco.
- Outro gestor autorizado executa essas alterações; no caso de departamento, deve ser de outro departamento.
- O gestor só concede direitos que possui efetivamente, considerando usuário e departamento, também ao criar uma nova conta. Isso impede a criação de uma conta mais privilegiada para contornar o bloqueio.
- Direitos e departamento do gestor são relidos sob o lock da empresa antes das concessões. Contexto antigo da requisição não autoriza elevação.
- Não foi criado um fluxo adicional de solicitações/aprovações: a intervenção independente é a operação feita pelo segundo gestor autorizado.

## Cobertura e limites

Compilação concluída e 107 testes aprovados. Além da matriz, há cenários específicos de autoelevação, delegação acima dos próprios direitos, contexto desatualizado, gestor inativo e concessão por outro gestor autorizado.

Os testes HTTP usam JWT e guards reais com repositório simulado: confirmam listagem, leitura, HEAD, edição e exclusão de clientes na empresa correta, recusa de IDs de outra empresa, rejeição de `idEmpresa` no corpo e impossibilidade de trocar o tenant via cabeçalho. Testes dos serviços verificam IDs externos nos dois sentidos entre empresas para pedidos, itens, compras, status, financeiro e administração de acessos, sem gravações após a recusa. Os testes anteriores de vínculos e de rotação/revogação continuam passando.

**PostgreSQL real: adiado por solicitação do usuário.** Uma instância temporária isolada chegou a ser iniciada e foi encerrada assim que solicitado. Não foram aplicadas migrations da aplicação nem executada a suíte de integração nela. Os testes de concorrência atuais usam repositório simulado, não comprovam locks ou constraints no PostgreSQL. Esta correção não altera o schema nem exige nova migration.

## Rotas

| Método | Rota | Exigência |
| --- | --- | --- |
| POST | `/auth/login` | `publica` |
| POST | `/auth/refresh` | `publica` |
| GET | `/auth/me` | `autenticado` |
| POST | `/auth/logout` | `autenticado` |
| POST | `/auth/logout-todos` | `autenticado` |
| PATCH | `/auth/senha` | `autenticado` |
| GET | `/acessos/permissoes` | `acessos.ler` |
| GET | `/acessos/departamentos` | `acessos.ler` |
| POST | `/acessos/departamentos` | `acessos.gerenciar` |
| PUT | `/acessos/departamentos/:id/permissoes` | `acessos.gerenciar` |
| GET | `/acessos/usuarios` | `acessos.ler` |
| POST | `/acessos/usuarios` | `acessos.gerenciar` |
| PUT | `/acessos/usuarios/:id/permissoes` | `acessos.gerenciar` |
| PATCH | `/acessos/usuarios/:id` | `acessos.gerenciar` |
| GET | `/produtos` | `produtos.ler` |
| POST | `/produtos` | `produtos.gerenciar` |
| GET | `/produtos/categorias` | `produtos.ler` |
| POST | `/produtos/categoria` | `produtos.gerenciar` |
| GET | `/produtos/marcas` | `produtos.ler` |
| POST | `/produtos/marca` | `produtos.gerenciar` |
| GET | `/produtos/unidades-medida` | `produtos.ler` |
| POST | `/produtos/unidade-medida` | `produtos.gerenciar` |
| GET | `/estoque/alertas` | `estoque.ler` |
| POST | `/estoque/movimentacao` | `estoque.gerenciar` |
| GET | `/almoxarifados` | `estoque.ler` |
| POST | `/almoxarifados` | `estoque.gerenciar` |
| POST | `/financeiro/transacao` | `financeiro.gerenciar` |
| GET | `/financeiro/transacoes` | `financeiro.ler` |
| PATCH | `/financeiro/baixa/:id` | `financeiro.gerenciar` |
| PATCH | `/financeiro/cancelar/:id` | `financeiro.gerenciar` |
| GET | `/financeiro/fluxo-caixa` | `financeiro.ler` |
| GET | `/plano-contas` | `financeiro.ler` |
| POST | `/plano-contas` | `financeiro.gerenciar` |
| GET | `/centros-custo` | `financeiro.ler` |
| POST | `/centros-custo` | `financeiro.gerenciar` |
| GET | `/formas-pagamento` | `financeiro.ler` |
| POST | `/formas-pagamento` | `financeiro.gerenciar` |
| GET | `/clientes` | `clientes.ler` |
| POST | `/clientes` | `clientes.gerenciar` |
| GET | `/clientes/:id` | `clientes.ler` |
| PUT | `/clientes/:id` | `clientes.gerenciar` |
| DELETE | `/clientes/:id` | `clientes.gerenciar` |
| GET | `/compras` | `compras.ler` |
| POST | `/compras` | `compras.gerenciar` |
| GET | `/compras/:id` | `compras.ler` |
| GET | `/fornecedores` | `compras.ler` |
| POST | `/fornecedores` | `compras.gerenciar` |
| POST | `/fornecedores/vincular` | `compras.gerenciar` |
| GET | `/pedidos` | `pedidos.ler` |
| POST | `/pedidos` | `pedidos.gerenciar` |
| GET | `/pedidos/:id` | `pedidos.ler` |
| PATCH | `/pedidos/:id/status` | `pedidos.gerenciar` |
| PATCH | `/pedidos/:id/itens/:itemId/status` | `pedidos.gerenciar` |
| GET | `/pedidos/status/pedido` | `pedidos.ler` |
| POST | `/pedidos/status/pedido` | `pedidos.gerenciar` |
| PATCH | `/pedidos/status/pedido/:id` | `pedidos.gerenciar` |
| GET | `/pedidos/status/produto` | `pedidos.ler` |
| POST | `/pedidos/status/produto` | `pedidos.gerenciar` |
| PATCH | `/pedidos/status/produto/:id` | `pedidos.gerenciar` |
