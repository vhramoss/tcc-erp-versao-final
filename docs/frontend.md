# Frontend (parte 6)

Aplicação **Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS**, na pasta `frontend/`. Fala somente com a API NestJS, nunca com o banco.

## Arquitetura

```
Navegador ──(cookies httpOnly)──▶ Next.js (BFF em /api/*) ──(Bearer)──▶ API NestJS ──▶ PostgreSQL
```

O navegador **nunca** vê os tokens JWT. O servidor do Next (BFF) guarda access e refresh em cookies `httpOnly`, injeta o `Authorization` em cada chamada e renova a sessão sozinho.

| Peça | Arquivo | Função |
|---|---|---|
| Login | `src/app/api/auth/login/route.ts` | Recebe CNPJ, usuário e senha, chama a API, grava cookies e responde só `{ ok: true }` |
| Logout | `src/app/api/auth/logout/route.ts` | Revoga a sessão na API e apaga os cookies |
| Proxy | `src/app/api/[...path]/route.ts` | `/api/<rota>` → API `/<rota>` com o token; renova e repete 1 vez se expirou; bloqueia `/auth/login` e `/auth/refresh`; proteção CSRF |
| Renovação | `src/server/backend.ts` | "Voo único": várias requisições com o mesmo refresh token compartilham uma única renovação (a API trata reutilização como roubo e revogaria a sessão) |
| Páginas protegidas | `src/middleware.ts` | Redireciona para `/login` se não há cookie de sessão |

### Segurança aplicada

- Tokens em cookies `httpOnly` + `SameSite=Lax`, restritos a `/api` (`Secure` em produção).
- CSRF: métodos que alteram dados exigem o cabeçalho `x-requested-with: erp-web` e `Origin` igual ao host.
- Cabeçalhos: `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Redirecionamento pós-login só para caminhos internos (sem redirecionamento aberto).
- Permissões na interface (menu e botões) espelham o backend, **que continua sendo quem autoriza**. Custos e margens saem do servidor apenas para `financeiro.ler`.

## Organização por módulo

Cada módulo do backend tem sua pasta em `src/modules/<modulo>/` com `types.ts` (formatos da API), `api.ts` (hooks do TanStack Query), e as telas. As páginas em `src/app/(app)/` são finas e só chamam a tela do módulo.

| Módulo | Telas |
|---|---|
| `dashboard` | Painel: faturamento, pedidos, ticket médio, margem, mais e menos vendidos, estoque parado, fluxo de caixa e alertas |
| `produtos` | Produtos, categorias, marcas, unidades de medida |
| `estoque` | Saldos, movimentação, histórico, alertas, almoxarifados |
| `clientes` | Cadastro com busca, edição e exclusão |
| `pedidos` | Lista com filtros, novo pedido, detalhe (status, recebimento), configuração de status |
| `compras` | Compras, fornecedores, nova compra (com nota de entrada opcional) |
| `financeiro` | Lançamentos, fluxo de caixa com gráfico, tesouraria |
| `acessos` | Usuários, departamentos e matriz de permissões |
| `perfil` | Dados da conta, troca de senha, encerrar todas as sessões |

Componentes reutilizáveis: `src/components/ui` (botão, campos, tabela, modal, abas, paginação, seleção pesquisável, avisos) e `src/components/domain`.

## Como rodar

```bash
# 1. backend (porta 3000)
npm install && cp .env.example .env   # preencha DATABASE_URL, JWT_*, SEED_ADMIN_PASSWORD
npx prisma migrate deploy && npm run seed:dev && npm run build && npm run start

# 2. frontend (porta 3001)
cd frontend && npm install && cp .env.example .env.local
npm run dev        # desenvolvimento
# ou: npm run build && npm run start
```

Login do seed: CNPJ `00.000.000/0001-91`, usuário `dev`, senha = `SEED_ADMIN_PASSWORD`.

Em produção: HTTPS (`COOKIE_SECURE=true`), `TRUST_PROXY` no backend e um proxy reverso que **sobrescreva** `X-Forwarded-For`.

## Testes

| Comando | O que cobre | Precisa de |
|---|---|---|
| `cd frontend && npm test` | Formatação, datas, máscaras e tradução de mensagens | nada |
| `cd frontend && npm run test:ui` | Renderiza as telas em jsdom com dados reais e cria um pedido pela interface | backend, banco e frontend no ar |
| `cd frontend && npm run test:bff` | Cookies, CSRF, renovação concorrente, fluxos de negócio, permissões e limitador pelo BFF | backend, banco e frontend no ar |
| `node test/integracao-api-frontend.mjs` (na raiz) | Login por CNPJ, saldos, movimentos, indicadores, custos ocultos, limitador por IP | backend e banco no ar |

## IDs numéricos

A API usa IDs inteiros gerados pelo PostgreSQL. Para atualizar um banco antigo com UUID, siga [IDs incrementais](ids-incrementais.md) antes de iniciar os serviços.
