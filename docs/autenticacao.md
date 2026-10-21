# Autenticação e permissões — passo 5

Implementa o objetivo (d) do PDF: autenticação JWT em duas camadas, hash de senha e acesso limitado pelo departamento. O isolamento por empresa é preservado nos vínculos e nas consultas. O PDF e os backups ZIP não foram alterados.

## Configuração e primeiro acesso

Copie `.env.example` para `.env` e configure `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` e `SEED_ADMIN_PASSWORD`. Cada segredo JWT deve ter pelo menos 32 bytes e ser diferente do outro. Para gerar cada um, execute separadamente:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Não há segredo JWT padrão. A aplicação recusa iniciar sem configuração válida. A senha inicial deve ter entre 12 e 128 caracteres.

Depois de configurar o banco de desenvolvimento:

```powershell
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run seed:dev
npm.cmd run start:dev
```

As migrations incluem o baseline do passo 4 e `20261020010000_autenticacao`, que adiciona `SessaoRefresh` e `DepartamentoPermissao`. Não use reset em banco com dados. Se as tabelas foram criadas manualmente, primeiro reconcilie esse banco com o histórico de migrations.

O seed cria a empresa de demonstração e o usuário `dev`, com permissões administrativas individuais e no departamento. Imprime o `idEmpresa`, sem imprimir a senha. Substitui somente a senha placeholder do seed antigo pelo hash; não redefine uma senha real já existente. Executá-lo novamente reaplica as permissões de demonstração. É exclusivo de desenvolvimento e bloqueado quando `NODE_ENV=production`.

## Login e sessão

`POST /auth/login`:

```json
{
  "idEmpresa": "UUID_DA_EMPRESA",
  "username": "dev",
  "senha": "SENHA_CONFIGURADA_NO_SEED"
}
```

A resposta segue o envelope existente `{ "success": true, "data": { ... }, "timestamp": "..." }`. Em `data` ficam `accessToken`, `refreshToken`, `tokenType`, `expiresIn` e `refreshExpiresIn`.

O access token dura até 15 minutos; o refresh token tem duração absoluta de 7 dias desde o login. São JWTs HS256 com segredos, tipos e audiências distintos. Assinatura, emissor, audiência, expiração e identificadores são verificados. Um refresh token não serve para acessar as rotas de negócio.

Envie nas rotas protegidas:

```text
Authorization: Bearer ACCESS_TOKEN
```

Os antigos `x-user-id` e `x-empresa-id` não autenticam nem substituem a identidade do token. No login, a empresa seleciona a conta; nas demais operações, vem do token validado e da sessão no banco.

| Método | Rota | Corpo/função |
| --- | --- | --- |
| POST | `/auth/login` | Empresa, username e senha; pública |
| POST | `/auth/refresh` | `{ "refreshToken": "..." }`; pública, exige refresh válido |
| GET | `/auth/me` | Identidade e permissões efetivas |
| POST | `/auth/logout` | Encerra a sessão atual |
| POST | `/auth/logout-todos` | Encerra todas as sessões do usuário |
| PATCH | `/auth/senha` | `{ "senhaAtual": "...", "novaSenha": "..." }`; encerra todas as sessões após alteração |

O banco guarda apenas SHA-256 do refresh token, associado a usuário e empresa. Cada renovação substitui esse hash. Reutilizar um refresh antigo revoga a sessão inteira, inclusive os access tokens ligados a ela. O cliente deve fazer uma única renovação por vez: duas chamadas simultâneas com o mesmo refresh são tratadas como reutilização. A renovação não prolonga o prazo absoluto de sete dias.

Logout, desativação do usuário e troca de senha impedem novas requisições com os tokens revogados. Requisições já autorizadas e em andamento podem concluir. Login/refresh têm resposta `Cache-Control: no-store`. Os tokens são retornados no corpo; armazenamento no navegador e integração com Next.js ficam para o passo 6.

## Permissões e departamentos

A permissão efetiva é a interseção entre `UsuarioPermissao` e `DepartamentoPermissao`. Estar no departamento não concede acesso sozinho. Usuário sem departamento ou sem concessões individuais não acessa módulos de negócio, mas pode consultar sua sessão, trocar senha e sair.

Cada recurso tem `.ler` para GET/HEAD e `.gerenciar` para POST/PUT/PATCH/DELETE. São concessões independentes: para ler e escrever, atribua ambas.

| Recurso | Rotas abrangidas |
| --- | --- |
| `produtos` | Produtos, categorias, marcas e unidades |
| `estoque` | Movimentação, alertas e almoxarifados |
| `financeiro` | Transações, fluxo, planos de contas, centros de custo e formas de pagamento |
| `clientes` | Clientes |
| `pedidos` | Pedidos, itens e status |
| `compras` | Compras e fornecedores |
| `acessos` | Administração de usuários, departamentos e permissões |

Por exemplo, `pedidos.gerenciar` autoriza criar uma venda com seus efeitos automáticos no estoque e financeiro; não concede acesso direto às rotas desses outros módulos. Toda rota nova sem política explícita é negada por padrão.

As concessões são lidas do banco em cada requisição, não congeladas no JWT. Mudança de departamento remove as permissões individuais anteriores e encerra sessões; o gestor atribui as permissões do novo setor.

## Administração

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/acessos/permissoes` | Catálogo de permissões |
| GET/POST | `/acessos/departamentos` | Listar/criar; criação recebe `nome` e `sigla` opcional |
| PUT | `/acessos/departamentos/:id/permissoes` | Substitui permissões do departamento |
| GET/POST | `/acessos/usuarios` | Listar/criar usuários da empresa |
| PUT | `/acessos/usuarios/:id/permissoes` | Substitui permissões individuais |
| PATCH | `/acessos/usuarios/:id` | Altera `ativo` e/ou `departamentoId`; encerra sessões |

Para os PUTs, use `{ "permissoes": ["produtos.ler", "produtos.gerenciar"] }`. A lista substitui a anterior. Permissões individuais devem caber no departamento. O gestor não pode alterar suas próprias permissões nem as do seu departamento. A alteração exige outro gestor autorizado; para o departamento, ele deve pertencer a outro setor. Quem concede precisa possuir efetivamente todas as permissões solicitadas, inclusive ao criar usuários, evitando delegação acima dos próprios direitos. O serviço relê os direitos e o departamento do gestor dentro da transação. Não há fila de aprovação: o outro gestor executa a alteração pela API. A desativação/mudança do próprio usuário também exige outro gestor.

Exemplo de criação de usuário, após cadastrar o departamento e autorizar suas permissões:

```json
{
  "username": "operador",
  "senha": "UMA_SENHA_DE_PELO_MENOS_12_CARACTERES",
  "departamentoId": "UUID_DO_DEPARTAMENTO",
  "permissoes": ["produtos.ler"],
  "pessoa": {
    "nome": "Operador",
    "email": "operador@empresa.example",
    "cpfCnpj": "12345678901",
    "tipo": "FISICA"
  }
}
```

Também é possível informar `pessoaId` de um cadastro da mesma empresa, em lugar de `pessoa`. Não envie ambos. Não há cadastro público de usuários ou empresas. As respostas administrativas não incluem hashes de senha.

## Senhas e validação

As senhas usam scrypt assíncrono, com salt aleatório de 16 bytes, N=32768, r=8, p=3 e comparação em tempo constante. Espaços fazem parte da senha e não são removidos pelo interceptor. Textos e hashes legados inválidos não são aceitos. Essa alternativa ao bcrypt usa o recurso nativo do Node.js; JWT utiliza a biblioteca `jose`, instalada do cache local porque o download estava bloqueado.

Há limite conjunto de 20 chamadas por minuto/IP para login, refresh e troca de senha, mantido em memória por processo. Não é um limite distribuído e não confia em `X-Forwarded-For`. Configuração de proxy, HTTPS e armazenamento dos tokens no frontend pertence à implantação/integração posterior.

Na revisão original do passo 5, schema e build foram validados e 40 testes passaram. Após a revisão de autorização, a compilação e os 107 testes passaram; veja [matriz de autorização](matriz-autorizacao.md). Os novos testes cobrem senhas, JWTs adulterados/expirados, rotação, reutilização concorrente, logout, permissões por departamento, vínculos externos e requisições HTTP reais. O banco é simulado nesses testes: não validam os locks e as migrations no PostgreSQL. Nesta sessão, não havia `.env` com `DATABASE_URL`; nenhuma migration foi aplicada ao banco.

Referências técnicas: [scrypt no Node.js](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback), [parâmetros de armazenamento de senhas — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [biblioteca jose](https://github.com/panva/jose).
