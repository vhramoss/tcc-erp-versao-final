// Teste ponta a ponta pelo BFF (Next.js) contra a API e o banco reais. Cria dados de teste (cliente, produto, pedido, compra, usuário).
// Pré-requisitos: backend com TRUST_PROXY=loopback, banco com seed, frontend no ar.
// Uso: ERP_SENHA='<SEED_ADMIN_PASSWORD>' [WEB_URL=http://localhost:3001] [ERP_CNPJ=00000000000191] [ERP_USER=dev] node test/e2e-bff.mjs
const W = process.env.WEB_URL ?? 'http://localhost:3001';
const CNPJ = process.env.ERP_CNPJ ?? '00.000.000/0001-91', USER = process.env.ERP_USER ?? 'dev', SENHA = process.env.ERP_SENHA;
if (!SENHA) { console.error('Defina ERP_SENHA (a senha do usuário do seed).'); process.exit(2); }
let pass = 0, fail = 0; const ok = (n, c, x = '') => { c ? pass++ : fail++; console.log((c ? 'PASS' : 'FAIL') + ' | ' + n + (c ? '' : '  -> ' + x)); };
const XRW = { 'x-requested-with': 'erp-web' };

// cliente com jar de cookies (simula o navegador)
const novoNavegador = () => {
  const jar = new Map();
  const absorver = (r) => { for (const sc of r.headers.getSetCookie?.() ?? []) { const [par, ...attrs] = sc.split('; '); const [k, v] = [par.slice(0, par.indexOf('=')), par.slice(par.indexOf('=') + 1)]; const apagar = /Max-Age=0/i.test(sc) || v === ''; apagar ? jar.delete(k) : jar.set(k, { v, attrs: attrs.join('; '), sc }); } };
  const cookie = (so) => [...jar].filter(([k]) => !so || so.includes(k)).map(([k, { v }]) => `${k}=${v}`).join('; ');
  const req = async (method, path, body, extra = {}, opts = {}) => {
    const r = await fetch(W + path, { method, redirect: 'manual', headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(opts.semXrw ? {} : XRW), cookie: cookie(opts.so), ...extra }, body: body !== undefined ? JSON.stringify(body) : undefined });
    absorver(r); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {}
    return { s: r.status, d: j?.data ?? j, raw: j, text: t, h: r.headers };
  };
  return { jar, req, cookie, absorver };
};

const b = novoNavegador();
// ---- páginas protegidas
let r = await b.req('GET', '/', undefined, {}, { semXrw: true }); ok('sem sessão: / redireciona para /login', r.s === 307 && r.h.get('location').endsWith('/login'), `${r.s} ${r.h.get('location')}`);
r = await b.req('GET', '/pedidos/nova', undefined, {}, { semXrw: true }); ok('sem sessão: rota interna guarda o destino (?next=)', r.s === 307 && r.h.get('location').includes('next=%2Fpedidos%2Fnova'), r.h.get('location'));
r = await b.req('GET', '/login', undefined, {}, { semXrw: true }); ok('/login responde 200 com o formulário', r.s === 200 && r.text.includes('CNPJ da empresa'), String(r.s));
// ---- login
r = await b.req('POST', '/api/auth/login', { cnpj: CNPJ, username: USER, senha: SENHA }, {}, { semXrw: true }); ok('login sem cabeçalho x-requested-with => 403', r.s === 403, String(r.s));
r = await b.req('POST', '/api/auth/login', { cnpj: CNPJ, username: USER, senha: 'errada-errada-1' }); ok('senha errada => 401 e nenhum cookie', r.s === 401 && b.jar.size === 0, `${r.s} jar=${b.jar.size}`);
r = await b.req('POST', '/api/auth/login', { cnpj: CNPJ, username: USER, senha: SENHA });
ok('login (CNPJ com máscara) => 200 { ok: true }', r.s === 200 && r.d?.ok === true, JSON.stringify(r.raw));
ok('corpo da resposta NÃO contém tokens', !/accessToken|refreshToken|eyJ/.test(r.text), r.text);
const sc = Object.fromEntries([...b.jar].map(([k, v]) => [k, v.sc]));
ok('3 cookies de sessão gravados', ['erp_at', 'erp_rt', 'erp_s'].every((k) => sc[k]), Object.keys(sc).join(','));
ok('tokens: HttpOnly, SameSite=Lax e Path=/api', ['erp_at', 'erp_rt'].every((k) => /HttpOnly/i.test(sc[k]) && /SameSite=lax/i.test(sc[k]) && /Path=\/api/i.test(sc[k])), JSON.stringify(sc));
ok('cookie de presença (erp_s) não carrega token e vale para o site todo', /Path=\//.test(sc.erp_s) && !/eyJ/.test(sc.erp_s) && /HttpOnly/i.test(sc.erp_s), sc.erp_s);
r = await b.req('GET', '/login?x=1', undefined, {}, { semXrw: true }); ok('logado: /login redireciona para /', r.s === 307, String(r.s));
r = await b.req('GET', '/login?expirada=1', undefined, {}, { semXrw: true }); ok('logado + ?expirada: /login NÃO redireciona (evita loop)', r.s === 200, String(r.s));
for (const rota of ['/', '/produtos', '/estoque', '/clientes', '/pedidos', '/pedidos/nova', '/compras', '/compras/nova', '/financeiro', '/acessos', '/perfil', '/pedidos/status']) {
  r = await b.req('GET', rota, undefined, {}, { semXrw: true }); if (r.s !== 200) ok(`página ${rota}`, false, String(r.s));
}
ok('12 páginas autenticadas respondem 200', true);

// ---- proxy
r = await b.req('GET', '/api/auth/me'); const me = r.d;
ok('/api/auth/me traz nome, empresa, departamento e 14 permissões', r.s === 200 && me.username === 'dev' && me.empresa?.nome && me.departamento?.nome && me.permissoes.length === 14, JSON.stringify(r.raw)?.slice(0, 200));
r = await b.req('POST', '/api/auth/refresh', { refreshToken: 'x' }); ok('proxy NÃO expõe /auth/refresh (404)', r.s === 404, String(r.s));
r = await b.req('POST', '/api/auth/login', { cnpj: CNPJ, username: USER, senha: SENHA }); // rota do BFF ok
r = await b.req('POST', '/api/clientes', { nome: 'x' }, {}, { semXrw: true }); ok('CSRF: POST sem x-requested-with => 403', r.s === 403, String(r.s));
r = await b.req('POST', '/api/clientes', { nome: 'x' }, { origin: 'https://site-malicioso.example' }); ok('CSRF: Origin de outro site => 403', r.s === 403, String(r.s));
r = await novoNavegador().req('GET', '/api/produtos'); ok('sem cookie => 401 do BFF', r.s === 401, String(r.s));

// ---- renovação: access some, refresh fica
b.jar.delete('erp_at');
r = await b.req('GET', '/api/auth/me'); ok('access ausente: BFF renova sozinho e responde 200', r.s === 200 && b.jar.has('erp_at'), String(r.s));
// 10 requisições simultâneas só com o refresh (access expirado) => voo único
const refreshAntigo = b.jar.get('erp_rt').v; b.jar.delete('erp_at');
const paralelas = await Promise.all(Array.from({ length: 10 }, () => b.req('GET', '/api/produtos', undefined, {}, { so: ['erp_rt', 'erp_s'] })));
ok('10 requisições simultâneas com access expirado: todas 200 (voo único de refresh)', paralelas.every((x) => x.s === 200), paralelas.map((x) => x.s).join(','));
ok('refresh rotacionou (cookie novo diferente do antigo)', b.jar.get('erp_rt').v !== refreshAntigo);
r = await b.req('GET', '/api/auth/me'); ok('sessão segue válida depois da corrida (não foi revogada)', r.s === 200, String(r.s));

// ---- fluxos de negócio pelo BFF, conferindo os formatos que as telas esperam
const run = Date.now().toString(36);
const get = (p, q) => b.req('GET', '/api' + p + (q ? '?' + new URLSearchParams(q) : ''));
const post = (p, body) => b.req('POST', '/api' + p, body);
const patch = (p, body) => b.req('PATCH', '/api' + p, body);
const alm = (await get('/almoxarifados')).d[0], cat = (await get('/produtos/categorias')).d[0], uni = (await get('/produtos/unidades-medida')).d[0];
r = await post('/produtos', { nome: `Notebook ${run}`, sku: `NB-${run}`, precoCusto: 2000, precoVenda: 3500, estoqueMinimo: 3, alertaEstoqueAtivo: true, categoriaId: cat.id, unidadeMedidaId: uni.id });
ok('produto criado', r.s === 201, JSON.stringify(r.raw)); const prod = r.d;
r = await get('/produtos'); const p = r.d.find((x) => x.id === prod.id);
ok('lista de produtos: categoria, unidadeMedida, precos[Padrão], precoCusto (admin vê)', p && p.categoria?.nome && p.unidadeMedida?.sigla && p.precos?.[0]?.nomeTabela === 'Padrão' && p.precos[0].precoVenda === '3500' || p?.precos?.[0]?.precoVenda === '3500.00' && p.precoCusto !== undefined, JSON.stringify(p)?.slice(0, 300));
r = await post('/estoque/movimentacao', { produtoId: prod.id, almoxarifadoId: alm.id, quantidade: 5, tipo: 'ENTRADA', observacao: 'carga' });
ok('movimentação: novoSaldo 5', r.s === 201 && r.d.novoSaldo === 5, JSON.stringify(r.raw));
const cli = (await post('/clientes', { nome: 'Ana Souza', email: `ana${run}@t.com`, cpfCnpj: `7${run}`.slice(0, 11).padEnd(11, '1'), tipo: 'FISICA' })).d;
r = await post('/pedidos', { clienteId: cli.id, almoxarifadoId: alm.id, dataVencimento: '2026-12-20', itens: [{ produtoId: prod.id, quantidade: 3 }] });
ok('pedido: alertas[] (saldo 2 <= mínimo 3), referência automática', r.s === 201 && r.d.alertas?.[0]?.alerta === true && /^PED-/.test(r.d.referencia) && r.d.valorTotal, JSON.stringify(r.raw)?.slice(0, 300)); const ped = r.d;
r = await get('/pedidos', { page: 1, limit: 15 });
const li = r.d.items?.find((x) => x.id === ped.id);
ok('lista de pedidos: paginada com cliente.pessoa, status{ehInicial} e financeiro{status,dataVencimento}', r.d.total >= 1 && li?.cliente?.pessoa?.nome === 'Ana Souza' && li.status?.ehInicial === true && li.financeiro?.status === 'PENDENTE' && li.financeiro.dataVencimento, JSON.stringify(li)?.slice(0, 300));
r = await get(`/pedidos/${ped.id}`);
ok('detalhe: itens[] com produto{nome,sku}, status do item e custoUnitario (admin)', r.s === 200 && r.d.itens?.[0]?.produto?.sku && r.d.itens[0].status?.nome && r.d.itens[0].custoUnitario !== undefined && r.d.financeiro?.id, JSON.stringify(r.d)?.slice(0, 400));
r = await get('/estoque/saldos', { busca: `Notebook ${run}`, page: 1, limit: 15 });
ok('saldos: noMinimoOuAbaixo = true, saldo 2', r.d.items?.[0]?.saldoTotal === 2 && r.d.items[0].noMinimoOuAbaixo === true && r.d.items[0].unidade, JSON.stringify(r.d)?.slice(0, 300));
r = await get('/estoque/movimentos', { produtoId: prod.id, page: 1, limit: 15 });
ok('movimentos: origem Pedido (pedidoId) e usuário', r.d.items?.some((m) => m.tipo === 'SAIDA' && m.pedidoId) && r.d.items[0].usuario?.username === 'dev' && r.d.items[0].estoque?.produto?.nome, JSON.stringify(r.d.items?.[0])?.slice(0, 300));
r = await get('/estoque/alertas'); ok('alertas: contém o Notebook (abaixoDoMinimo ou no mínimo)', r.d.some((a) => a.produtoId === prod.id), '');
r = await get('/financeiro/transacoes', { status: 'PENDENTE', page: 1, limit: 15 });
const tr = r.d.items?.find((t) => t.pedidoId === ped.id);
ok('transações: pedidoId, atrasado(boolean), formaPagamento/planoContas (nulo ou objeto)', tr && typeof tr.atrasado === 'boolean' && tr.tipo === 'RECEITA' && 'planoContas' in tr, JSON.stringify(tr)?.slice(0, 300));
const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
r = await get('/financeiro/fluxo-caixa', { dataInicio: '2026-12-01', dataFim: '2026-12-31' });
ok('fluxo de caixa: previsto.totalReceitas inclui o pedido de 10.500', r.d.previsto?.totalReceitas >= 10500 && r.d.emAtraso && typeof r.d.saldoProjetado === 'number', JSON.stringify(r.d));
r = await get('/dashboard/indicadores', { dataInicio: hoje, dataFim: hoje }); ok('indicadores via BFF: faturamento >= 10.500, margem presente', r.d.vendas?.faturamento >= 10500 && r.d.podeVerMargem === true && Array.isArray(r.d.maisVendidos), JSON.stringify(r.d)?.slice(0, 200));
r = await patch(`/financeiro/baixa/${tr.id}`); ok('baixa do recebimento', r.s === 200 && r.d.status === 'PAGO', JSON.stringify(r.raw));
const stc = (await get('/pedidos/status/pedido')).d; const cancel = stc.find((s) => s.ehCancelamento);
r = await patch(`/pedidos/${ped.id}/status`, { statusId: cancel.id }); ok('cancelar pedido já recebido => 400 com mensagem (a tela exibe)', r.s === 400 && typeof r.raw.message === 'string', JSON.stringify(r.raw));
const ped2 = (await post('/pedidos', { clienteId: cli.id, almoxarifadoId: alm.id, dataVencimento: '2026-12-20', itens: [{ produtoId: prod.id, quantidade: 1 }] })).d;
r = await patch(`/pedidos/${ped2.id}/status`, { statusId: cancel.id }); ok('cancelar pedido pendente => estorno', r.s === 200 && r.d.status?.ehCancelamento === true, JSON.stringify(r.raw)?.slice(0, 200));
r = await get('/estoque/saldos', { busca: `Notebook ${run}`, page: 1, limit: 15 }); ok('estoque voltou a 2 após o estorno', r.d.items[0].saldoTotal === 2, String(r.d.items[0].saldoTotal));
r = await patch(`/pedidos/${ped2.id}/itens/${ped2.itens?.[0]?.id ?? 'x'}/status`, { statusId: (await get('/pedidos/status/produto')).d[0].id }); info: console.log('INFO | troca status de item em pedido cancelado ->', r.s);

// ---- compras e fornecedores
const forn = (await post('/fornecedores', { nome: 'Dell Brasil', email: `f${run}@t.com`, cpfCnpj: `1${run}`.padEnd(14, '2').slice(0, 14), tipo: 'JURIDICA' }));
ok('fornecedor criado (PessoaFormModal)', forn.s === 201 && forn.d.pessoa?.nome === 'Dell Brasil', JSON.stringify(forn.raw)?.slice(0, 200));
r = await post('/compras', { referencia: `COMP-${run}`, fornecedorId: forn.d.id, almoxarifadoId: alm.id, dataVencimento: '2026-12-15', acrescimos: 50, desconto: 20, itens: [{ produtoId: prod.id, quantidade: 4, valorUnitario: 1900.5 }], nota: { numero: '1234', serie: '1', dataEmissao: '2026-10-20' } });
ok('compra criada: total 7632 (4×1900,50 + 50 − 20), financeiro DESPESA', r.s === 201 && Number(r.d.valorTotal) === 7632 && r.d.financeiro?.status === 'PENDENTE', JSON.stringify(r.raw)?.slice(0, 300)); const compra = r.d;
r = await get(`/compras/${compra.id}`); ok('detalhe da compra: itens[] com produtoId e valorTotal', r.d.itens?.[0]?.produtoId === prod.id && r.d.fornecedor?.pessoa?.nome, JSON.stringify(r.d)?.slice(0, 250));
r = await get('/estoque/saldos', { busca: `Notebook ${run}`, page: 1, limit: 15 }); ok('compra abasteceu o estoque (2 + 4 = 6)', r.d.items[0].saldoTotal === 6, String(r.d.items[0].saldoTotal));

// ---- acessos
r = await get('/acessos/permissoes'); ok('catálogo de permissões: 14 itens (nomes ou objetos)', Array.isArray(r.d) && r.d.length === 14, JSON.stringify(r.d)?.slice(0, 120));
r = await get('/acessos/usuarios'); ok('usuários trazem pessoa{nome,email} e permissoes[].permissao.nome', r.d[0]?.pessoa?.nome && r.d[0].permissoes?.[0]?.permissao?.nome, JSON.stringify(r.d[0])?.slice(0, 250));
r = await get('/acessos/departamentos'); ok('departamentos trazem permissoes[].permissao.nome', r.d[0]?.permissoes?.[0]?.permissao?.nome, JSON.stringify(r.d[0])?.slice(0, 200));
const dep = (await post('/acessos/departamentos', { nome: `Vendas ${run}`, sigla: 'VND' })).d;
await b.req('PUT', `/api/acessos/departamentos/${dep.id}/permissoes`, { permissoes: ['pedidos.ler', 'pedidos.gerenciar', 'clientes.ler', 'estoque.ler', 'produtos.ler'] });
const usr = await post('/acessos/usuarios', { departamentoId: dep.id, username: `vend${run}`, senha: 'OutraSenha#2026!y', permissoes: ['pedidos.ler', 'pedidos.gerenciar', 'clientes.ler', 'estoque.ler', 'produtos.ler'], pessoa: { nome: 'Vera Vendedora', email: `v${run}@t.com`, cpfCnpj: `5${run}`.padEnd(11, '3').slice(0, 11), tipo: 'FISICA' } });
ok('admin cria usuário de vendas', usr.s === 201, JSON.stringify(usr.raw)?.slice(0, 200));

// ---- vendedor: sem custos, sem financeiro
const v = novoNavegador();
r = await v.req('POST', '/api/auth/login', { cnpj: CNPJ, username: `vend${run}`, senha: 'OutraSenha#2026!y' }); ok('vendedor entra', r.s === 200, JSON.stringify(r.raw));
r = await v.req('GET', '/api/produtos'); const pv = r.d?.find((x) => x.id === prod.id);
ok('vendedor: produtos SEM precoCusto (removido no servidor)', r.s === 200 && pv && !('precoCusto' in pv) && pv.precos?.length, JSON.stringify(pv)?.slice(0, 200));
r = await v.req('GET', `/api/pedidos/${ped.id}`); ok('vendedor: itens do pedido SEM custoUnitario', r.s === 200 && !('custoUnitario' in r.d.itens[0]), JSON.stringify(r.d?.itens?.[0])?.slice(0, 200));
r = await v.req('GET', '/api/financeiro/transacoes'); ok('vendedor: financeiro => 403', r.s === 403, String(r.s));
r = await v.req('GET', '/api/dashboard/indicadores?dataInicio=' + hoje + '&dataFim=' + hoje); ok('vendedor: indicadores sem lucro/margem', r.s === 200 && r.d.vendas.lucroBruto === null && r.d.podeVerMargem === false, JSON.stringify(r.d?.vendas));
r = await v.req('GET', '/api/acessos/usuarios'); ok('vendedor: acessos => 403', r.s === 403, String(r.s));

// ---- troca de senha encerra sessões
r = await v.req('PATCH', '/api/auth/senha', { senhaAtual: 'OutraSenha#2026!y', novaSenha: 'NovaSenha#2026!z' }); ok('vendedor troca a senha', r.s === 200, JSON.stringify(r.raw));
r = await v.req('GET', '/api/auth/me'); ok('após trocar a senha a sessão antiga caiu (401)', r.s === 401, String(r.s));

// ---- logout
r = await b.req('POST', '/api/auth/logout'); ok('logout limpa os cookies', r.s === 200 && b.jar.size === 0, `jar=${b.jar.size}`);
r = await b.req('GET', '/api/auth/me'); ok('após logout: 401', r.s === 401, String(r.s));
r = await b.req('GET', '/', undefined, {}, { semXrw: true }); ok('após logout: / volta ao login', r.s === 307, String(r.s));

// ---- limitador de login com IP real repassado pelo BFF
const lim = novoNavegador(); let c429 = 0;
for (let i = 0; i < 24; i++) { const x = await lim.req('POST', '/api/auth/login', { cnpj: CNPJ, username: USER, senha: 'errada-errada-1' }, { 'x-forwarded-for': '203.0.113.7' }); if (x.s === 429) c429++; }
ok('limitador: IP 203.0.113.7 recebe 429 após 20 tentativas', c429 >= 3, `429=${c429}`);
const outro = await novoNavegador().req('POST', '/api/auth/login', { cnpj: CNPJ, username: USER, senha: SENHA }, { 'x-forwarded-for': '198.51.100.9' });
ok('limitador: OUTRO IP não é afetado (BFF repassa o IP real)', outro.s === 200, String(outro.s));

console.log(`\nRESUMO: ${pass} passaram, ${fail} falharam`); process.exit(fail ? 1 : 0);
