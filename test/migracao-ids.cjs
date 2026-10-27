const {Client}=require('pg');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 if (!process.env.TEST_DATABASE_URL) throw new Error('Defina TEST_DATABASE_URL para um banco descartável e vazio.');
 const db=new Client({connectionString:process.env.TEST_DATABASE_URL});
 await db.connect();
 try {
  const existentes = await db.query("SELECT count(*)::int AS total FROM information_schema.tables WHERE table_schema='public'");
  assert.equal(existentes.rows[0].total, 0, 'O banco de teste deve estar vazio antes de iniciar.');
  for(const pasta of ['20261020000000_inicial','20261020010000_autenticacao']) await db.query(fs.readFileSync(`prisma/migrations/${pasta}/migration.sql`,'utf8'));
  await db.query(`INSERT INTO "Empresa" (id,nome,cnpj,email,"updatedAt") VALUES ('uuid-legado','Teste','00000000000191','teste@local',now())`);
  const sql=fs.readFileSync('prisma/migrations/20261026000000_ids_incrementais/migration.sql','utf8');
  await assert.rejects(db.query(sql), /banco deve estar vazio/);
  await db.query('ROLLBACK');
  assert.equal((await db.query('SELECT id FROM "Empresa"')).rows[0].id,'uuid-legado');
  await db.query('DELETE FROM "Empresa"');
  await db.query(sql);
  const cols=(await db.query(`SELECT table_name,column_name,data_type,column_default FROM information_schema.columns WHERE table_schema='public' AND (column_name='id' OR column_name='idEmpresa' OR column_name LIKE '%Id')`)).rows;
  assert.ok(cols.length>90);
  assert.ok(cols.every(c=>c.data_type==='integer'));
  assert.ok(cols.filter(c=>c.column_name==='id').every(c=>c.column_default?.includes('nextval')));
  console.log(`PASS: migration bloqueia dados antigos sem altera-los; ${cols.length} colunas de ID inteiras; ${cols.filter(c=>c.column_name==='id').length} sequencias.`);
 } finally {await db.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
