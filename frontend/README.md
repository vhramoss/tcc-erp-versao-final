# ERP PME — Frontend

Interface web do sistema ERP para pequenas empresas e comércios locais. **Next.js 15 · React 19 · TypeScript · Tailwind CSS · TanStack Query.**

Arquitetura (BFF com cookies httpOnly), módulos, segurança e testes: veja [`../docs/frontend.md`](../docs/frontend.md).

```bash
cp .env.example .env.local   # API_URL aponta para o backend (padrão http://localhost:3000)
npm install
npm run dev                  # http://localhost:3001
```

| Script | Função |
|---|---|
| `npm run dev` / `build` / `start` | Desenvolvimento, build e execução de produção (porta 3001) |
| `npm run typecheck` | Verificação de tipos |
| `npm test` | Testes unitários (sem servidor) |
| `npm run test:ui` | Telas renderizadas em jsdom com a API real |
| `npm run test:bff` | Ponta a ponta pelo BFF (sessão, CSRF, renovação concorrente, permissões) |
