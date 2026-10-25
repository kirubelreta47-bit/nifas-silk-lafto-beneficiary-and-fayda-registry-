const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { INITIAL_BENEFICIARIES, INITIAL_CUSTOM_FIELDS } = require('./initialData');

const connectionString = process.env.DATABASE_URL;

let pool = null;

if (connectionString) {
  const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  pool = new Pool({
    connectionString,
    ssl: isLocalhost ? false : { rejectUnauthorized: false }
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });
} else {
  console.warn('⚠️ DATABASE_URL is not set. Database queries will run in memory fallback mode.');
}

async function query(text, params) {
  if (!pool) {
    throw new Error('Database pool is not initialized. Please configure DATABASE_URL.');
  }
  return pool.query(text, params);
}

// Auto-initialize schema, tables, indexes, and seed data if missing
async function initDatabase() {
  if (!pool) {
    console.warn('Skipping database migration: DATABASE_URL not configured.');
    return;
  }

  const client = await pool.connect();
  try {
    console.log('🔄 Checking and initializing PostgreSQL tables...');

    // 1. Create beneficiaries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS beneficiaries (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        sub_city VARCHAR(100) NOT NULL DEFAULT 'ንፋስ ስልክ ላፍቶ',
        woreda VARCHAR(50) NOT NULL,
        block_zone VARCHAR(50) NOT NULL,
        locality VARCHAR(150),
        house_no VARCHAR(50),
        fayda_id VARCHAR(30) NOT NULL UNIQUE,
        gender VARCHAR(10) NOT NULL,
        age INTEGER NOT NULL,
        health_status VARCHAR(100) NOT NULL DEFAULT 'ጤነኛ',
        family_male INTEGER NOT NULL DEFAULT 0,
        family_female INTEGER NOT NULL DEFAULT 0,
        family_total INTEGER NOT NULL DEFAULT 0,
        phone VARCHAR(30) NOT NULL,
        category VARCHAR(50) NOT NULL,
        registration_date DATE DEFAULT CURRENT_DATE,
        custom_fields JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create custom_form_fields table
    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_form_fields (
        id VARCHAR(100) PRIMARY KEY,
        label_am VARCHAR(255) NOT NULL,
        label_en VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        options TEXT[] DEFAULT '{}',
        required BOOLEAN DEFAULT false,
        default_value TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create admin_users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        woreda VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create performance indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_fayda ON beneficiaries(fayda_id);
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_woreda ON beneficiaries(woreda);
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_category ON beneficiaries(category);
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_health ON beneficiaries(health_status);
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_phone ON beneficiaries(phone);
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_name ON beneficiaries(full_name);
    `);

    // 5. Seed Custom Fields if table is empty
    const fieldsCheck = await client.query('SELECT COUNT(*) FROM custom_form_fields;');
    if (parseInt(fieldsCheck.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial custom form fields...');
      for (let i = 0; i < INITIAL_CUSTOM_FIELDS.length; i++) {
        const f = INITIAL_CUSTOM_FIELDS[i];
        await client.query(
          `INSERT INTO custom_form_fields (id, label_am, label_en, type, options, required, default_value, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING;`,
          [f.id, f.labelAm, f.labelEn, f.type, f.options || [], f.required, f.defaultValue || null, i]
        );
      }
    }

    // 6. Seed Beneficiaries if table is empty
    const benCheck = await client.query('SELECT COUNT(*) FROM beneficiaries;');
    if (parseInt(benCheck.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding sample beneficiaries for Nifas Silk-Lafto...');
      for (const b of INITIAL_BENEFICIARIES) {
        await client.query(
          `INSERT INTO beneficiaries (
             id, full_name, sub_city, woreda, block_zone, locality, house_no,
             fayda_id, gender, age, health_status, family_male, family_female,
             family_total, phone, category, registration_date, custom_fields
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
           ON CONFLICT (fayda_id) DO NOTHING;`,
          [
            b.id, b.fullName, b.subCity, b.woreda, b.blockZone, b.locality, b.houseNo,
            b.faydaId, b.gender, b.age, b.healthStatus, b.familyMale, b.familyFemale,
            b.familyTotal, b.phone, b.category, b.registrationDate || new Date().toISOString().split('T')[0],
            JSON.stringify(b.customFields || {})
          ]
        );
      }
      await client.query(`SELECT setval('beneficiaries_id_seq', COALESCE((SELECT MAX(id) FROM beneficiaries), 1));`);
    }

    // 7. Seed or Update Admin and Officer accounts
    const adminHash = await bcrypt.hash('123321123', 10);
    const officerHash = await bcrypt.hash('Woreda@2024', 10);

    await client.query(
      `INSERT INTO admin_users (username, full_name, email, password_hash, role, woreda)
       VALUES 
         ($1, $2, $3, $4, 'super_admin', 'ዋና መ/ቤት'),
         ($5, $6, $7, $8, 'woreda_officer', 'ለቡ 01')
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;`,
      ['admin', 'ዋና አስተዳዳሪ (System Administrator)', 'admin@nslsubcity.gov.et', adminHash,
       'woreda01', 'አቶ ብርሃኑ ተስፋዬ (የለቡ 01 መዝጋቢ)', 'birhanu@nslsubcity.gov.et', officerHash]
    );

    console.log('✅ PostgreSQL database tables and seeds ready.');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  initDatabase
};
