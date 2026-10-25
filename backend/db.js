const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { INITIAL_BENEFICIARIES, INITIAL_CUSTOM_FIELDS } = require('./initialData');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ FATAL: DATABASE_URL environment variable is not defined.');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

// Automatically create tables and seed default admin on server startup
async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing PostgreSQL database tables in Neon...');

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

    // 2. Create custom_fields table
    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_fields (
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

    // Ensure backwards compatibility with custom_form_fields
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

    // 3. Create admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'super_admin',
        woreda VARCHAR(50) DEFAULT 'ዋና መ/ቤት',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure backwards compatibility with admin_users
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'super_admin',
        woreda VARCHAR(50) DEFAULT 'ዋና መ/ቤት',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Performance Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_fayda ON beneficiaries(fayda_id);
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_woreda ON beneficiaries(woreda);
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_category ON beneficiaries(category);
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_phone ON beneficiaries(phone);
      CREATE INDEX IF NOT EXISTS idx_beneficiaries_name ON beneficiaries(full_name);
      CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
      CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
    `);

    // 5. Seed or Update Default Admins & Users (admin: '123321123', user1: '12345678')
    const adminHash = await bcrypt.hash('123321123', 10);
    const userHash = await bcrypt.hash('12345678', 10);

    // Normalize any legacy roles
    await client.query(`UPDATE admins SET role = 'user' WHERE role = 'woreda_officer';`).catch(() => {});
    await client.query(`UPDATE admins SET role = 'admin' WHERE role = 'super_admin';`).catch(() => {});

    // Upsert admin and user1 into admins
    await client.query(
      `INSERT INTO admins (username, full_name, email, password_hash, role, woreda)
       VALUES 
         ($1, $2, $3, $4, 'admin', 'ዋና መ/ቤት'),
         ($5, $6, $7, $8, 'user', 'ለቡ 01')
       ON CONFLICT (username) DO UPDATE SET 
         password_hash = EXCLUDED.password_hash,
         email = EXCLUDED.email,
         role = EXCLUDED.role;`,
      ['admin', 'ዋና አስተዳዳሪ (System Administrator)', 'admin@nslsubcity.gov.et', adminHash,
       'user1', 'አቶ ብርሃኑ ተስፋዬ (የለቡ 01 መዝጋቢ)', 'user1@nslsubcity.gov.et', userHash]
    );

    // 6. Seed custom_fields if empty
    const fieldsCheck = await client.query('SELECT COUNT(*) FROM custom_fields;');
    if (parseInt(fieldsCheck.rows[0].count, 10) === 0) {
      for (let i = 0; i < INITIAL_CUSTOM_FIELDS.length; i++) {
        const f = INITIAL_CUSTOM_FIELDS[i];
        await client.query(
          `INSERT INTO custom_fields (id, label_am, label_en, type, options, required, default_value, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING;`,
          [f.id, f.labelAm, f.labelEn, f.type, f.options || [], f.required, f.defaultValue || null, i]
        );
        await client.query(
          `INSERT INTO custom_form_fields (id, label_am, label_en, type, options, required, default_value, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING;`,
          [f.id, f.labelAm, f.labelEn, f.type, f.options || [], f.required, f.defaultValue || null, i]
        );
      }
    }

    // 7. Seed sample beneficiaries if empty
    const benCheck = await client.query('SELECT COUNT(*) FROM beneficiaries;');
    if (parseInt(benCheck.rows[0].count, 10) === 0) {
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

    console.log('✅ PostgreSQL Neon tables (beneficiaries, custom_fields, admins) ready.');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  initDatabase
};
