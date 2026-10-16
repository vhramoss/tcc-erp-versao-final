import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Seed de DESENVOLVIMENTO: cria uma empresa de teste com os cadastros mínimos
// para exercitar produtos, estoque, financeiro e (no passo 4) pedidos.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const empresa = await prisma.empresa.upsert({
    where: { cnpj: '00000000000191' },
    update: {},
    create: { nome: 'Empresa Demo', cnpj: '00000000000191', email: 'demo@erp.local' },
  });
  const idEmpresa = empresa.id;

  // Usuário de teste REAL: EstoqueMovimento e Pedido têm FK para Usuario, então o
  // header x-user-id do guard de dev precisa ser o id de um usuário existente.
  const departamento = await prisma.departamento.upsert({
    where: { idEmpresa_nome: { idEmpresa, nome: 'Administrativo' } },
    update: {},
    create: { idEmpresa, nome: 'Administrativo', sigla: 'ADM' },
  });
  const pessoaUsuario = await prisma.pessoa.upsert({
    where: { idEmpresa_cpfCnpj: { idEmpresa, cpfCnpj: '00000000000' } },
    update: {},
    create: { idEmpresa, nome: 'Usuário Dev', email: 'dev@erp.local', cpfCnpj: '00000000000', tipo: 'FISICA' },
  });
  const usuario = await prisma.usuario.upsert({
    where: { idEmpresa_username: { idEmpresa, username: 'dev' } },
    update: {},
    create: {
      idEmpresa,
      pessoaId: pessoaUsuario.id,
      departamentoId: departamento.id,
      username: 'dev',
      password: 'DEV-ONLY-NOT-A-REAL-HASH', // o hash real (bcrypt) entra no passo 5
    },
  });

  const almoxarifado = await prisma.almoxarifado.upsert({
    where: { idEmpresa_nome: { idEmpresa, nome: 'Depósito Central' } },
    update: {},
    create: { idEmpresa, nome: 'Depósito Central' },
  });

  const categoria =
    (await prisma.categoriaProduto.findFirst({ where: { idEmpresa, nome: 'Geral' } })) ??
    (await prisma.categoriaProduto.create({ data: { idEmpresa, nome: 'Geral' } }));

  const unidade = await prisma.unidadeMedida.upsert({
    where: { idEmpresa_sigla: { idEmpresa, sigla: 'UN' } },
    update: {},
    create: { idEmpresa, sigla: 'UN', nome: 'Unidade' },
  });

  const forma = await prisma.formaPagamento.upsert({
    where: { idEmpresa_nome: { idEmpresa, nome: 'Pix' } },
    update: {},
    create: { idEmpresa, nome: 'Pix' },
  });

  const planoReceita = await prisma.planoContas.upsert({
    where: { idEmpresa_codigo: { idEmpresa, codigo: '1.1.01' } },
    update: {},
    create: { idEmpresa, codigo: '1.1.01', nome: 'Receita de Vendas', tipo: 'RECEITA' },
  });

  const planoDespesa = await prisma.planoContas.upsert({
    where: { idEmpresa_codigo: { idEmpresa, codigo: '2.1.01' } },
    update: {},
    create: { idEmpresa, codigo: '2.1.01', nome: 'Despesas Operacionais', tipo: 'DESPESA' },
  });

  // Status configuráveis (objetivo c). Toda empresa nova precisa deste conjunto padrão;
  // depois o gestor pode criar, renomear e reordenar.
  const statusPadrao = [
    { nome: 'Novo', ordem: 1, ehInicial: true, ehFinal: false, ehCancelamento: false },
    { nome: 'Em separação', ordem: 2, ehInicial: false, ehFinal: false, ehCancelamento: false },
    { nome: 'Entregue', ordem: 3, ehInicial: false, ehFinal: true, ehCancelamento: false },
    { nome: 'Cancelado', ordem: 4, ehInicial: false, ehFinal: true, ehCancelamento: true },
  ];
  const statusPedidos: Record<string, string> = {};
  for (const st of statusPadrao) {
    const criado = await prisma.statusPedido.upsert({
      where: { idEmpresa_nome: { idEmpresa, nome: st.nome } },
      update: {},
      create: { idEmpresa, ...st },
    });
    statusPedidos[st.nome] = criado.id;
  }

  const statusProdutos: Record<string, string> = {};
  for (const [i, nome] of ['Pendente', 'Separado', 'Entregue'].entries()) {
    const criado = await prisma.statusProduto.upsert({
      where: { idEmpresa_nome: { idEmpresa, nome } },
      update: {},
      create: { idEmpresa, nome, ordem: i + 1 },
    });
    statusProdutos[nome] = criado.id;
  }

  console.log('\n=== Seed concluído. Headers das requisições: ===');
  console.log(`x-empresa-id: ${idEmpresa}`);
  console.log(`x-user-id:    ${usuario.id}`);
  console.log('\nIds úteis para os corpos das requisições:');
  console.log({
    almoxarifadoId: almoxarifado.id,
    categoriaId: categoria.id,
    unidadeMedidaId: unidade.id,
    formaPagamentoId: forma.id,
    planoContasReceitaId: planoReceita.id,
    planoContasDespesaId: planoDespesa.id,
    statusPedidos,
    statusProdutos,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
