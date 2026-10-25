const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

async function inspectColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const res = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'beneficiaries'
    ORDER BY ordinal_position;
  `);
  console.log('Columns in beneficiaries:', res.rows);

  await pool.end();
}

inspectColumns().catch(console.error);
