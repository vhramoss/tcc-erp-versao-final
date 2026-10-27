# IDs incrementais

Todos os modelos usam `Int @id @default(autoincrement())`. As chaves estrangeiras também são inteiras. Cada tabela tem sua própria sequência global: não reinicia por empresa e pode ter intervalos por rollback. O isolamento por empresa e as permissões continuam obrigatórios.

A API retorna IDs como números JSON e exige inteiros positivos até 2147483647. Rotas usam `/pedidos/1`; filtros aceitam a representação decimal dos IDs. Os formulários convertem as seleções para números. CNPJ, CPF, SKU, códigos contábeis e números de documentos continuam como texto para preservar zeros e formatação.

A referência automática de pedido usa o ID reservado pela sequência PostgreSQL: `PED-000001`. Referências manuais continuam disponíveis e únicas por empresa. A reserva usa `nextval`, sem `MAX(id) + 1`, inclusive sob concorrência.

## Atualizar o banco de desenvolvimento

A migration `20261026000000_ids_incrementais` exige todas as tabelas da aplicação vazias. Ela verifica isso sob bloqueio e dentro de uma transação antes de alterar qualquer coluna. Não converte nem apaga registros existentes. As migrations anteriores foram preservadas.

Pare o backend e o frontend antes da troca. Você pode criar um banco novo e vazio no PostgreSQL e ajustar `DATABASE_URL` no seu `.env`. Depois, na raiz do projeto:

```powershell
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run seed:dev
npm.cmd run build
```

Se preferir reutilizar o banco de desenvolvimento, confira primeiro o destino de `DATABASE_URL`. O comando abaixo APAGA os dados e recria o schema, aplicando todas as migrations; execute somente no banco de teste descartável:

```powershell
npx.cmd prisma migrate reset
npm.cmd run prisma:generate
npm.cmd run seed:dev
npm.cmd run build
```

Não basta remover registros mantendo o schema antigo sem aplicar a migration. Não execute o seed entre as migrations antigas e a nova. O seed só deve rodar ao final.

Em seguida inicie o backend com `npm.cmd run start:dev` e, em outro terminal, o frontend com `cd frontend` e `npm.cmd run dev`. Faça login novamente: tokens e links antigos com UUID deixam de ser válidos.

## Proteção dos dados

UUID era um identificador, não criptografia. Senhas permanecem com scrypt e salt individual; o banco guarda somente o hash do refresh token. JWTs continuam assinados, com expiração e identificador aleatório próprio (`jti`), e os cookies continuam httpOnly. O `sub` do JWT é a representação textual do ID numérico; empresa e sessão são números. Nenhuma proteção existente foi removida e não foi adicionada criptografia reversível indiscriminada aos cadastros.

## Testes

`npm.cmd test` cobre validação dos IDs, autenticação, isolamento e regras de negócio. Para repetir a validação SQL, aponte `TEST_DATABASE_URL` para um banco separado, vazio e descartável e execute `node test/migracao-ids.cjs` na raiz. Esse teste aplica as três migrations e verifica que a conversão recusa dados antigos sem alterá-los. Ele não usa `DATABASE_URL`.
