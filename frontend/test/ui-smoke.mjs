// Teste de interface com jsdom + API real. NÃO faz parte do `npm test` (precisa de backend, banco e BFF no ar).
// Uso: npm run build  (opcional)  e  node test/ui-smoke.mjs
//   Variáveis: WEB_URL (padrão http://localhost:3001), ERP_CNPJ, ERP_USER, ERP_SENHA
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = process.env.WEB_URL ?? 'http://localhost:3001';
const CNPJ = process.env.ERP_CNPJ ?? '00000000000191', USER = process.env.ERP_USER ?? 'dev', SENHA = process.env.ERP_SENHA ?? 'SenhaForte#2026!x';

// 1) empacota as telas (aliases para @/ e para os stubs do Next)
const saida = path.join(raiz, '.ui-test', 'bundle.mjs');
await build({
  entryPoints: [path.join(raiz, 'test/ui-entry.tsx')], outfile: saida, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external', logLevel: 'error',
  alias: { '@': path.join(raiz, 'src'), 'next/navigation': path.join(raiz, 'test/stubs-next-navigation.ts'), 'next/link': path.join(raiz, 'test/stubs-next-link.tsx') },
});

// 2) login real pelo BFF
const login = await fetch(`${WEB}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'erp-web' }, body: JSON.stringify({ cnpj: CNPJ, username: USER, senha: SENHA }) });
if (!login.ok) { console.error('Login falhou:', login.status, await login.text()); process.exit(2); }
const COOKIES = login.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
const realFetch = globalThis.fetch;

// 3) ambiente de navegador falso
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: `${WEB}/`, pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'MutationObserver', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[k] = w[k];
Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true });
globalThis.localStorage = w.localStorage;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
w.matchMedia = globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.__ui = { path: '/', search: '', navegou: [] };
globalThis.fetch = (url, init = {}) => realFetch(new URL(String(url), WEB), { ...init, headers: { ...(init.headers ?? {}), cookie: COOKIES } });

const erros = [];
const consoleError = console.error;
console.error = (...a) => { const t = a.map(String).join(' '); if (!/not wrapped in act|Not implemented: navigation/.test(t)) erros.push(t.slice(0, 300)); };

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
const V = await import(pathToFileURL(saida).href);

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { c ? pass++ : fail++; console.log((c ? 'PASS' : 'FAIL') + ' | ' + n + (c ? '' : '  -> ' + String(x).slice(0, 220))); };
const esperar = async (cond, ms = 9000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (cond()) return true; await act(async () => { await new Promise((r) => setTimeout(r, 60)); }); } return cond(); };
const montar = async (Comp, props = {}, { path: p = '/', search = '' } = {}) => {
  globalThis.__ui.path = p; globalThis.__ui.search = search; globalThis.__ui.navegou = [];
  document.body.innerHTML = '<div id="raiz"></div>';
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const root = createRoot(document.getElementById('raiz'));
  await act(async () => { root.render(React.createElement(QueryClientProvider, { client }, React.createElement(Comp, props), React.createElement(V.Providers, null))); });
  await esperar(() => !client.isFetching({ queryKey: ['me'] }));
  return { texto: () => document.body.textContent ?? '', root, client, desmontar: () => act(async () => root.unmount()) };
};
const mudar = async (el, valor) => { const proto = el instanceof w.HTMLTextAreaElement ? w.HTMLTextAreaElement.prototype : el instanceof w.HTMLSelectElement ? w.HTMLSelectElement.prototype : w.HTMLInputElement.prototype; await act(async () => { Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, valor); el.dispatchEvent(new w.Event(el instanceof w.HTMLSelectElement ? 'change' : 'input', { bubbles: true })); }); };
const clicar = async (el) => act(async () => { el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); });
const botao = (rotulo) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === rotulo || b.textContent.includes(rotulo));
const api = async (p) => (await (await realFetch(new URL('/api' + p, WEB), { headers: { cookie: COOKIES, 'x-requested-with': 'erp-web' } })).json()).data;

const produtos = await api('/produtos'); const pedidos = await api('/pedidos?page=1&limit=15'); const compras = await api('/compras');
const prod = produtos.find((p) => p.nome.startsWith('Notebook')) ?? produtos[0];
const pedidoComItens = pedidos.items[0];

// ---------------- telas
let t;
t = await montar(V.DashboardView); await esperar(() => /Faturamento/.test(t.texto()) && /Ticket médio/.test(t.texto()) && !document.querySelector('.animate-pulse'));
ok('Painel: indicadores do PDF (faturamento, ticket médio, margem), rankings e fluxo de caixa', ['Faturamento', 'Ticket médio', 'Margem bruta', 'Mais vendidos', 'Menos vendidos', 'Estoque parado', 'Saldo projetado', 'Alertas de reposição'].every((s) => t.texto().includes(s)), t.texto().slice(0, 300)); await t.desmontar();

t = await montar(V.ProdutosView); await esperar(() => t.texto().includes(prod.nome));
ok('Produtos: lista com nome, SKU e preço', t.texto().includes(prod.nome) && t.texto().includes(prod.sku) && t.texto().includes('R$'), t.texto().slice(0, 200));
await clicar(botao('Novo produto')); await esperar(() => document.querySelector('[role=dialog]'));
ok('Produtos: modal "Novo produto" abre com categoria, unidade e margem', !!document.querySelector('[role=dialog]') && t.texto().includes('Unidade de medida') && t.texto().includes('Preço de custo'), '');
const campos = [...document.querySelectorAll('[role=dialog] input')]; await mudar(campos.find((i) => /custo/i.test(document.querySelector(`label[for="${i.id}"]`)?.textContent ?? '')), '40,00'); await mudar(campos.find((i) => /venda/i.test(document.querySelector(`label[for="${i.id}"]`)?.textContent ?? '')), '100,00');
ok('Produtos: margem calculada ao digitar custo e venda (60%)', t.texto().includes('Margem bruta de 60'), t.texto().slice(-300));
await t.desmontar();

t = await montar(V.EstoqueView); await esperar(() => t.texto().includes(prod.sku));
ok('Estoque: aba Saldos com situação e saldo por almoxarifado', t.texto().includes(prod.nome) && /Normal|Repor|Sem alerta/.test(t.texto()), t.texto().slice(0, 250)); await t.desmontar();
t = await montar(V.EstoqueView, {}, { search: 'aba=historico' }); await esperar(() => /Entrada|Saída/.test(t.texto()));
ok('Estoque: histórico mostra tipo, origem (Pedido/Compra/Manual) e usuário', /Entrada|Saída/.test(t.texto()) && /Pedido|Compra|Manual/.test(t.texto()), t.texto().slice(0, 250)); await t.desmontar();
t = await montar(V.EstoqueView, {}, { search: 'aba=alertas' }); await esperar(() => !document.querySelector('.animate-pulse'));
ok('Estoque: aba Alertas renderiza (lista ou estado vazio)', /Repor|Tudo certo|Abaixo do mínimo|No mínimo/.test(t.texto()), t.texto().slice(0, 200)); await t.desmontar();

t = await montar(V.ClientesView); await esperar(() => t.texto().includes('Ana Souza') || t.texto().includes('Nenhum cliente'));
ok('Clientes: lista com nome e documento formatado', t.texto().includes('Ana Souza'), t.texto().slice(0, 200));
await clicar(botao('Novo cliente')); await esperar(() => document.querySelector('[role=dialog]'));
await clicar(botao('Cadastrar')); ok('Clientes: formulário vazio mostra erros de validação em português', t.texto().includes('Informe o nome.') && t.texto().includes('Informe um e-mail válido.'), t.texto().slice(-300)); await t.desmontar();

t = await montar(V.PedidosView); await esperar(() => t.texto().includes(pedidoComItens.referencia));
ok('Pedidos: lista com referência, cliente, total, status e pagamento', t.texto().includes(pedidoComItens.referencia) && t.texto().includes('Ana Souza') && /Pendente|Recebido|Atrasado|Cancelado/.test(t.texto()), t.texto().slice(0, 300)); await t.desmontar();

t = await montar(V.PedidoDetalhe, { id: pedidoComItens.id }); await esperar(() => t.texto().includes('Itens') && t.texto().includes('Pagamento'));
ok('Pedido: detalhe com itens, total, pagamento, cliente e margem (admin)', ['Itens', 'Pagamento', 'Detalhes', 'Ana Souza', 'Margem'].every((s) => t.texto().includes(s)), t.texto().slice(0, 300)); await t.desmontar();

t = await montar(V.StatusView); await esperar(() => t.texto().includes('Cancela (estorna)'));
ok('Status: etapas com comportamento (inicial / encerra / cancela)', ['Inicial', 'Encerra', 'Cancela (estorna)', 'Status do pedido', 'Status dos itens'].every((s) => t.texto().includes(s)), t.texto().slice(0, 300)); await t.desmontar();

t = await montar(V.FinanceiroView); await esperar(() => /Receber|Pagar|Nenhum lançamento|Recebido|Pendente/.test(t.texto()) && !document.querySelector('.animate-pulse'));
ok('Financeiro: lançamentos com valor, situação e origem', /Pedido|Compra|Manual/.test(t.texto()) && /R\$/.test(t.texto()), t.texto().slice(0, 250)); await t.desmontar();
t = await montar(V.FinanceiroView, {}, { search: 'aba=fluxo' }); await esperar(() => t.texto().includes('Saldo projetado') && !document.querySelector('.animate-pulse'));
ok('Financeiro: fluxo de caixa (realizado, a receber, a pagar, projetado)', ['Saldo realizado', 'A receber', 'A pagar', 'Saldo projetado', 'Entradas e saídas'].every((s) => t.texto().includes(s)), t.texto().slice(0, 250)); await t.desmontar();
t = await montar(V.FinanceiroView, {}, { search: 'aba=tesouraria' }); await esperar(() => t.texto().includes('Plano de contas') && !document.querySelector('.animate-pulse'));
ok('Financeiro: tesouraria (plano de contas, centros, formas)', ['Plano de contas', 'Centros de custo', 'Formas de pagamento', 'Receita de Vendas'].every((s) => t.texto().includes(s)), t.texto().slice(0, 250)); await t.desmontar();

t = await montar(V.ComprasView); await esperar(() => t.texto().includes(compras[0].referencia));
ok('Compras: lista com referência, fornecedor, nota e pagamento', t.texto().includes(compras[0].referencia) && t.texto().includes('Dell Brasil'), t.texto().slice(0, 250));
await clicar([...document.querySelectorAll('tbody tr')][0]); await esperar(() => document.querySelector('[role=dialog]') && t.texto().includes('Total da compra'));
ok('Compras: clicar na linha abre o detalhe com itens e total', t.texto().includes('Total da compra'), t.texto().slice(-300)); await t.desmontar();

t = await montar(V.AcessosView); await esperar(() => t.texto().includes('@dev'));
ok('Acessos: usuários com nome, login, departamento e resumo de permissões', t.texto().includes('@dev') && t.texto().includes('Você') && /Ver e alterar|ver e alterar/.test(t.texto()), t.texto().slice(0, 300)); await t.desmontar();
t = await montar(V.PerfilView); await esperar(() => t.texto().includes('Administrativo') || t.texto().includes('@dev'));
ok('Perfil: dados, acessos efetivos e troca de senha', ['@dev', 'Alterar senha', 'Seus acessos', 'Ver e alterar'].every((s) => t.texto().includes(s)), t.texto().slice(0, 250)); await t.desmontar();

// ---------------- fluxo completo: criar um pedido pela tela
t = await montar(V.NovoPedido); await esperar(() => document.querySelectorAll('input[role=combobox]').length >= 2 && !document.querySelector('.animate-pulse') && (document.querySelector('select')?.options.length ?? 0) >= 1);
const combos = () => [...document.querySelectorAll('input[role=combobox]')];
const escolher = async (combo, busca) => { await act(async () => { combo.dispatchEvent(new w.Event('focusin', { bubbles: true })); combo.focus(); }); await mudar(combo, busca); await esperar(() => document.querySelector('[role=listbox] [role=option]')); const opcao = document.querySelector('[role=listbox] [role=option]'); await act(async () => { opcao.dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true })); }); };
await escolher(combos().find((c) => document.querySelector(`label[for="${c.id}"]`)?.textContent.includes('Cliente')), 'Ana');
await escolher(combos().find((c) => !document.querySelector(`label[for="${c.id}"]`) || /produto/i.test(c.getAttribute('aria-label') ?? '') || document.querySelector(`label[for="${c.id}"]`)?.textContent.includes('Produto')), prod.nome);
const qtd = document.querySelector('input[aria-label="Quantidade"]'); await mudar(qtd, '1');
const preco = Number(prod.precos[0].precoVenda);
ok('Novo pedido: subtotal e total calculados com o preço do cadastro', t.texto().replace(/\s/g, '').includes(preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\s/g, '')), t.texto().slice(-400));
const antes = (await api('/pedidos?page=1&limit=1')).total;
await clicar(botao('Finalizar pedido')); await esperar(() => globalThis.__ui.navegou.length > 0, 12000);
const depois = (await api('/pedidos?page=1&limit=1')).total;
ok('Novo pedido: "Finalizar pedido" cria no servidor e navega para o detalhe', depois === antes + 1 && /^\/pedidos\/[1-9][0-9]*$/.test(globalThis.__ui.navegou.at(-1) ?? ''), `${antes}->${depois} nav=${globalThis.__ui.navegou}`); await t.desmontar();

t = await montar(V.NovoPedido); await esperar(() => document.querySelectorAll('input[role=combobox]').length >= 2);
await clicar(botao('Finalizar pedido')); ok('Novo pedido: enviar vazio mostra os erros de validação', t.texto().includes('Selecione o cliente.') && t.texto().includes('Adicione ao menos um produto.'), t.texto().slice(-300)); await t.desmontar();

t = await montar(V.NovaCompra); await esperar(() => document.querySelectorAll('input[role=combobox]').length >= 2);
ok('Nova compra: formulário com itens, nota opcional e total', ['Itens comprados', 'Nota de entrada', 'Total a pagar', 'Registrar compra'].every((s) => t.texto().includes(s)), t.texto().slice(0, 200)); await t.desmontar();

console.error = consoleError;
ok('Nenhum erro/aviso do React durante as renderizações (chaves, hooks, hidratação)', erros.length === 0, erros.slice(0, 3).join(' || '));
console.log(`\nRESUMO: ${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
