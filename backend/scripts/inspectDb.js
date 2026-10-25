const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

async function inspect() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const res = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  );
  console.log('Tables in Neon:', res.rows.map(r => r.table_name));

  for (const row of res.rows) {
    const count = await pool.query(`SELECT COUNT(*) FROM "${row.table_name}";`);
    console.log(`Table ${row.table_name}: ${count.rows[0].count} rows`);
  }

  await pool.end();
}

inspect().catch(err => {
  console.error('Inspection error:', err);
  process.exit(1);
});
