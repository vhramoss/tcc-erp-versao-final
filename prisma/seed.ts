import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Seed de DESENVOLVIMENTO: cria uma empresa de teste com os cadastros mínimos
// para exercitar estoque, financeiro e (no passo 4) pedidos.
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

  const almoxarifado = await prisma.almoxarifado.upsert({
    where: { idEmpresa_nome: { idEmpresa, nome: 'Depósito Central' } },
    update: {},
    create: { idEmpresa, nome: 'Depósito Central' },
  });

  const categoria =
    (await prisma.categoriaProduto.findFirst({ where: { idEmpresa, nome: 'Geral' } })) ??
    (await prisma.categoriaProduto.create({ data: { idEmpresa, nome: 'Geral' } }));

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

  console.log('\n=== Seed concluído. Use nos headers das requisições: ===');
  console.log(`x-empresa-id: ${idEmpresa}`);
  console.log('x-user-id:    qualquer-texto (guard temporário de dev)');
  console.log('\nIds úteis para os corpos das requisições:');
  console.log({
    almoxarifadoId: almoxarifado.id,
    categoriaId: categoria.id,
    formaPagamentoId: forma.id,
    planoContasReceitaId: planoReceita.id,
    planoContasDespesaId: planoDespesa.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
