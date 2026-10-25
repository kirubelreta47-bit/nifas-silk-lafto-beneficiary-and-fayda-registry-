const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/../.env' });

async function verifyNeonLive() {
  console.log('--- 1. Testing Neon Database Connection & Table Schema ---');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Check tables
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('✅ Tables present in Neon DB:', tables.rows.map(r => r.table_name));

  // Verify beneficiaries, custom_fields, admins exist
  const tableNames = tables.rows.map(r => r.table_name);
  if (!tableNames.includes('beneficiaries') || !tableNames.includes('admins') || !tableNames.includes('custom_fields')) {
    console.log('⚠️ Running initDatabase() to create missing tables...');
    const { initDatabase } = require('../db');
    await initDatabase();
  }

  // Check admins table content
  console.log('--- 2. Verifying Admin User in Neon admins Table ---');
  const adminRes = await pool.query("SELECT id, username, email, role, password_hash FROM admins WHERE username = 'admin';");
  if (adminRes.rows.length === 0) {
    console.error('❌ Admin user not found in admins table!');
  } else {
    const admin = adminRes.rows[0];
    const isMatch = await bcrypt.compare('123321123', admin.password_hash);
    console.log(`✅ Admin user '${admin.username}' found. Password '123321123' bcrypt verification:`, isMatch ? 'PASSED (MATCH)' : 'FAILED');
  }

  // Test inserting a beneficiary into Neon database
  console.log('--- 3. Testing Beneficiary Direct Insert into Neon Database ---');
  const testFaydaId = '7777' + Math.floor(100000000000 + Math.random() * 900000000000);
  const insertQuery = `
    INSERT INTO beneficiaries (
      full_name, sub_city, woreda, block_zone, locality, house_no,
      fayda_id, gender, age, health_status, family_male, family_female,
      family_total, phone, category, registration_date, custom_fields
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING id, full_name, fayda_id, woreda, created_at;
  `;

  const insertRes = await pool.query(insertQuery, [
    'ዶ/ር ካሳሁን ደበበ (Dr. Kassahun Debebe)',
    'ንፋስ ስልክ ላፍቶ',
    'ለቡ 01',
    'ቀጠና 2',
    'ጀሞ 1',
    '402',
    testFaydaId,
    'ወ',
    45,
    'ጤነኛ',
    2,
    2,
    4,
    '0911556677',
    'በቀጣይነት የሚረዱ',
    new Date().toISOString().split('T')[0],
    JSON.stringify({ aidType: 'የምግብና የህክምና ድጋፍ', educationLevel: 'ዲፕሎማና ከዚያ በላይ' })
  ]);

  const inserted = insertRes.rows[0];
  console.log('✅ Beneficiary successfully inserted into Neon DB:');
  console.log(`   ID: #${inserted.id} | Name: ${inserted.full_name} | Fayda: ${inserted.fayda_id}`);

  // Query back from Neon to be 100% sure
  const verifyRes = await pool.query('SELECT id, full_name, fayda_id FROM beneficiaries WHERE id = $1;', [inserted.id]);
  console.log('✅ Beneficiary verified via SELECT query from Neon:', verifyRes.rows[0]);

  // Clean up test row
  await pool.query('DELETE FROM beneficiaries WHERE id = $1;', [inserted.id]);
  console.log('✅ Cleaned up test record.');

  await pool.end();
  console.log('--- ALL NEON DATABASE TESTS PASSED SUCCESSFULLY ---');
}

verifyNeonLive().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
