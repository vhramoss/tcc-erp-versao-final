// Teste de integração da API (sem navegador). Precisa de backend e banco no ar, com TRUST_PROXY=loopback para o item do limitador.
// Uso: BASE_URL=http://localhost:3000 ERP_SENHA='<SEED_ADMIN_PASSWORD>' node test/integracao-api-frontend.mjs
const B = process.env.BASE_URL ?? 'http://localhost:3000'; const CNPJ = process.env.ERP_CNPJ ?? '00000000000191', SENHA = process.env.ERP_SENHA;
if (!SENHA) { console.error('Defina ERP_SENHA (a senha do usuário "dev" criada pelo seed).'); process.exit(2); }
let pass = 0, fail = 0; const ok = (n, c, x = '') => { c ? pass++ : fail++; console.log((c ? 'PASS' : 'FAIL') + ' | ' + n + (c ? '' : ' -> ' + x)); };
const call = async (m, p, body, tok, extra = {}) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(tok ? { authorization: 'Bearer ' + tok } : {}), ...extra }, body: body ? JSON.stringify(body) : undefined }); let j = null; try { j = await r.json(); } catch {} return { s: r.status, d: j?.data ?? j, raw: j }; };
let r = await call('POST', '/auth/login', { cnpj: CNPJ, username: 'dev', senha: SENHA });
ok('login por CNPJ', r.s === 201 && r.d.accessToken, JSON.stringify(r.raw)); const T = r.d.accessToken;
r = await call('POST', '/auth/login', { cnpj: '11111111111111', username: 'dev', senha: SENHA }); ok('CNPJ inexistente => 401 genérico', r.s === 401, r.s);
r = await call('POST', '/auth/login', { cnpj: CNPJ, username: 'dev', senha: 'errada-errada-1' }); ok('senha errada => 401', r.s === 401, r.s);
r = await call('POST', '/auth/login', { cnpj: 'abc', username: 'dev', senha: SENHA }); ok('CNPJ malformado => 400', r.s === 400, r.s);
r = await call('POST', '/auth/login', { username: 'dev', senha: SENHA }); ok('sem empresa => 400', r.s === 400, r.s);
r = await call('GET', '/auth/me', null, T); ok('/auth/me traz nome, empresa, departamento e permissões', r.s === 200 && r.d.empresa?.cnpj === CNPJ && r.d.username === 'dev' && r.d.departamento?.nome && r.d.permissoes.length === 14, JSON.stringify(r.raw));
const EMP = r.d.idEmpresa;
// dados
const alm = (await call('GET', '/almoxarifados', null, T)).d[0].id, cat = (await call('GET', '/produtos/categorias', null, T)).d[0].id, uni = (await call('GET', '/produtos/unidades-medida', null, T)).d[0].id;
const run = Date.now().toString(36);
const prod = async (nome, custo, preco, min) => (await call('POST', '/produtos', { nome: `${nome} ${run}`, sku: `${nome}-${run}`, precoCusto: custo, precoVenda: preco, estoqueMinimo: min, categoriaId: cat, unidadeMedidaId: uni }, T)).d;
const p1 = await prod('Camiseta', 20, 50, 5), p2 = await prod('Caneca', 5, 15, 2), p3 = await prod('Encalhado', 8, 30, 0);
for (const [p, q] of [[p1, 10], [p2, 20], [p3, 4]]) await call('POST', '/estoque/movimentacao', { produtoId: p.id, almoxarifadoId: alm, quantidade: q, tipo: 'ENTRADA', observacao: 'carga inicial' }, T);
const cli = (await call('POST', '/clientes', { nome: 'Maria', email: `m${run}@t.com`, cpfCnpj: `9${run}`.slice(0, 11), tipo: 'FISICA' }, T)).d;
const ped = await call('POST', '/pedidos', { clienteId: cli.id, almoxarifadoId: alm, dataVencimento: '2026-12-10', itens: [{ produtoId: p1.id, quantidade: 3 }, { produtoId: p2.id, quantidade: 4 }] }, T); ok('pedido criado', ped.s === 201, JSON.stringify(ped.raw));
// saldos
r = await call('GET', '/estoque/saldos?busca=' + encodeURIComponent('Camiseta ' + run), null, T);
ok('saldos: filtro por busca, saldo 7 e unidade', r.s === 200 && r.d.total === 1 && r.d.items[0].saldoTotal === 7 && r.d.items[0].unidade, JSON.stringify(r.raw));
r = await call('GET', '/estoque/saldos?limit=2&page=1', null, T); ok('saldos: paginação', r.s === 200 && r.d.items.length <= 2 && r.d.limit === 2, JSON.stringify(r.raw).slice(0, 200));
r = await call('GET', '/estoque/movimentos?produtoId=' + p1.id, null, T);
ok('movimentos: 2 registros (ENTRADA e SAIDA do pedido) com usuário e pedido', r.s === 200 && r.d.total === 2 && r.d.items.some((m) => m.tipo === 'SAIDA' && m.pedidoId) && r.d.items[0].usuario.username === 'dev', JSON.stringify(r.raw).slice(0, 300));
r = await call('GET', '/estoque/movimentos?produtoId=nao-uuid', null, T); ok('movimentos: filtro inválido => 400', r.s === 400, r.s);
// indicadores
const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
r = await call('GET', `/dashboard/indicadores?dataInicio=${hoje}&dataFim=${hoje}`, null, T); const v = r.d?.vendas;
ok('indicadores: 1 pedido, faturamento 210.00 (3x50 + 4x15), ticket 210', r.s === 200 && v.pedidos === 1 && v.faturamento === 210 && v.ticketMedio === 210, JSON.stringify(r.raw).slice(0, 400));
ok('indicadores: lucro 3x30 + 4x10 = 130.00 e margem 61.9%', v.lucroBruto === 130 && v.margemPercentual === 61.9, JSON.stringify(v));
ok('indicadores: série diária com o dia de hoje', r.d.serieDiaria.length === 1 && r.d.serieDiaria[0].data === hoje, JSON.stringify(r.d.serieDiaria));
ok('indicadores: mais vendido é a Camiseta; encalhado inclui o produto sem venda', r.d.maisVendidos[0].nome.startsWith('Camiseta') && r.d.encalhados.some((e) => e.nome.startsWith('Encalhado')), JSON.stringify([r.d.maisVendidos[0], r.d.encalhados]).slice(0, 300));
r = await call('GET', `/dashboard/indicadores?dataInicio=2026-12-31&dataFim=2026-01-01`, null, T); ok('indicadores: período invertido => 400', r.s === 400, r.s);
r = await call('GET', `/dashboard/indicadores?dataInicio=2020-01-01&dataFim=2026-01-01`, null, T); ok('indicadores: período > 366 dias => 400', r.s === 400, r.s);
// usuário sem financeiro: margem/custo ocultos
const dep = (await call('POST', '/acessos/departamentos', { nome: 'Vendas ' + run, sigla: 'VND' }, T)).d;
await call('PUT', `/acessos/departamentos/${dep.id}/permissoes`, { permissoes: ['pedidos.ler', 'pedidos.gerenciar', 'estoque.ler'] }, T);
const u = await call('POST', '/acessos/usuarios', { departamentoId: dep.id, username: 'vendedor' + run, senha: 'OutraSenha#2026!y', permissoes: ['pedidos.ler', 'estoque.ler'], pessoa: { nome: 'Vendedor', email: `v${run}@t.com`, cpfCnpj: `8${run}`.slice(0, 11), tipo: 'FISICA' } }, T);
ok('admin cria usuário de vendas', u.s === 201, JSON.stringify(u.raw));
const lv = await call('POST', '/auth/login', { cnpj: CNPJ, username: 'vendedor' + run, senha: 'OutraSenha#2026!y' }); const TV = lv.d.accessToken;
r = await call('GET', `/dashboard/indicadores?dataInicio=${hoje}&dataFim=${hoje}`, null, TV);
ok('vendedor vê vendas mas NÃO vê lucro, margem nem capital parado', r.s === 200 && r.d.vendas.faturamento === 210 && r.d.vendas.lucroBruto === null && r.d.maisVendidos[0].lucro === null && r.d.encalhados[0].capitalParado === null && r.d.podeVerMargem === false, JSON.stringify(r.raw).slice(0, 300));
r = await call('GET', '/financeiro/fluxo-caixa?dataInicio=2026-12-01&dataFim=2026-12-31', null, TV); ok('vendedor não acessa financeiro (403)', r.s === 403, r.s);
// limitador por IP real (TRUST_PROXY=loopback)
let c429 = 0; for (let i = 0; i < 22; i++) { const x = await call('POST', '/auth/login', { cnpj: CNPJ, username: 'dev', senha: 'errada-errada-1' }, null, { 'x-forwarded-for': '10.9.9.9' }); if (x.s === 429) c429++; }
ok('limitador: IP 10.9.9.9 bloqueado após 20 tentativas (2 recusas 429)', c429 >= 2, `429=${c429}`);
r = await call('POST', '/auth/login', { cnpj: CNPJ, username: 'dev', senha: SENHA }, null, { 'x-forwarded-for': '10.8.8.8' }); ok('limitador: outro IP NÃO é afetado (login ok)', r.s === 201, r.s);
console.log(`\nRESUMO: ${pass} passaram, ${fail} falharam`); process.exit(fail ? 1 : 0);
