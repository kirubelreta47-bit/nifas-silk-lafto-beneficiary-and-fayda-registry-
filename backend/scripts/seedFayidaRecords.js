/**
 * Clears beneficiaries, then loads every row in fayida_records.json,
 * including incomplete Fayda numbers, missing phones, and duplicates.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const SOURCE = path.join(__dirname, '..', '..', 'fayida_records.json');
const REJECTED = path.join(__dirname, '..', '..', 'fayida_records_not_created.json');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000
});

function clip(value, max) {
  const text = String(value ?? '').trim();
  return text.length > max ? text.slice(0, max) : text;
}

function normalizePhone(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.startsWith('251') && digits.length === 12) digits = `0${digits.slice(3)}`;
  if (digits.length === 9 && digits.startsWith('9')) digits = `0${digits}`;
  return digits;
}

function normalizeGender(raw) {
  const value = String(raw ?? '').trim().toLowerCase();
  if (['ሴ', 'ሴት', 'f', 'female', 'woman'].includes(value) || value.startsWith('ሴ')) return 'ሴ';
  return 'ወ';
}

function normalizeCategory(raw) {
  const trimmed = String(raw ?? '').trim();
  const value = trimmed.toLowerCase();
  if (trimmed === 'ሰሪ ሀይል' || value.includes('ሰሪ') || value.includes('workforce') || value.includes('worker')) {
    return 'ሰሪ ሀይል';
  }
  return trimmed === 'በቀጣይነት የሚረዱ' || value.includes('ቀጣይ') || !trimmed
    ? 'በቀጣይነት የሚረዱ'
    : 'በቀጣይነት የሚረዱ';
}

function cleanRecord(raw) {
  const fullName = String(raw.fullName ?? '').trim();
  const faydaId = String(raw.faydaId ?? '').trim();
  const phone = String(raw.phone ?? '').trim();
  const familyMale = Math.max(0, Number(raw.familyMale) || 0);
  const familyFemale = Math.max(0, Number(raw.familyFemale) || 0);
  const statedTotal = Number(raw.familyTotal);
  const familyTotal = Number.isFinite(statedTotal) ? statedTotal : familyMale + familyFemale;
  const customInput = raw.customFields && typeof raw.customFields === 'object' ? raw.customFields : {};
  const registrationDate = String(raw.registrationDate ?? '').trim();

  return {
    row: {
      fullName,
      subCity: String(raw.subCity ?? '').trim() || 'ንፋስ ስልክ ላፍቶ',
      woreda: String(raw.woreda ?? '').trim() || 'ለቡ 01',
      blockZone: String(raw.blockZone ?? '').trim() || 'ቀጠና 1',
      locality: String(raw.locality ?? '').trim(),
      houseNo: String(raw.houseNo ?? '').trim(),
      faydaId,
      gender: String(raw.gender ?? '').trim() || normalizeGender(raw.gender),
      age: Number.isFinite(Number(raw.age)) ? Number(raw.age) : 0,
      healthStatus: String(raw.healthStatus ?? '').trim() || 'ጤነኛ',
      familyMale,
      familyFemale,
      familyTotal,
      phone,
      category: String(raw.category ?? '').trim() || normalizeCategory(raw.category),
      registrationDate: /^\d{4}-\d{2}-\d{2}$/.test(registrationDate) ? registrationDate : null,
      customFields: customInput
    }
  };
}

async function insertChunk(client, chunk) {
  const columns = 17;
  const values = [];
  const params = [];
  chunk.forEach((item, index) => {
    const base = index * columns;
    const placeholders = [];
    for (let n = 1; n <= columns; n += 1) placeholders.push(`$${base + n}`);
    values.push(`(${placeholders.join(', ')})`);
    const row = item.row;
    params.push(
      row.fullName,
      row.subCity,
      row.woreda,
      row.blockZone,
      row.locality,
      row.houseNo,
      row.faydaId,
      row.gender,
      row.age,
      row.healthStatus,
      row.familyMale,
      row.familyFemale,
      row.familyTotal,
      row.phone,
      row.category,
      row.registrationDate,
      JSON.stringify(row.customFields)
    );
  });

  await client.query(
    `
    INSERT INTO beneficiaries (
      full_name, sub_city, woreda, block_zone, locality, house_no,
      fayda_id, gender, age, health_status, family_male, family_female,
      family_total, phone, category, registration_date, custom_fields
    )
    VALUES ${values.join(', ')}
    `,
    params
  );
}

(async () => {
  const parsed = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const incoming = Array.isArray(parsed) ? parsed : parsed.records;
  if (!Array.isArray(incoming)) throw new Error('fayida_records.json has no records array');

  const accepted = incoming.map((raw) => cleanRecord(raw));
  fs.writeFileSync(REJECTED, JSON.stringify({ records: [] }, null, 2));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        FOR constraint_name IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
          WHERE rel.relname = 'beneficiaries'
            AND att.attname = 'fayda_id'
            AND con.contype = 'u'
        LOOP
          EXECUTE format('ALTER TABLE beneficiaries DROP CONSTRAINT %I', constraint_name);
        END LOOP;
      END $$;
    `);
    await client.query('DROP INDEX IF EXISTS beneficiaries_fayda_id_uidx');
    await client.query(`
      ALTER TABLE beneficiaries
        ALTER COLUMN full_name TYPE TEXT,
        ALTER COLUMN sub_city TYPE TEXT,
        ALTER COLUMN woreda TYPE TEXT,
        ALTER COLUMN block_zone TYPE TEXT,
        ALTER COLUMN locality TYPE TEXT,
        ALTER COLUMN house_no TYPE TEXT,
        ALTER COLUMN fayda_id TYPE TEXT,
        ALTER COLUMN gender TYPE TEXT,
        ALTER COLUMN health_status TYPE TEXT,
        ALTER COLUMN phone TYPE TEXT,
        ALTER COLUMN category TYPE TEXT;
    `);
    await client.query('DELETE FROM beneficiaries');
    await client.query("SELECT setval('beneficiaries_id_seq', 1, false)");

    const chunkSize = 200;
    for (let offset = 0; offset < accepted.length; offset += chunkSize) {
      const chunk = accepted.slice(offset, offset + chunkSize);
      await insertChunk(client, chunk);
      if ((offset / chunkSize) % 10 === 0) {
        console.log(`inserted ${Math.min(offset + chunk.length, accepted.length)} / ${accepted.length}`);
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const count = await pool.query('SELECT COUNT(*)::int AS count FROM beneficiaries');
  console.log(JSON.stringify({
    source: incoming.length,
    accepted: accepted.length,
    notCreated: 0,
    inDatabase: count.rows[0].count
  }));
  await pool.end();
})().catch(async (err) => {
  console.error(err.stack || String(err));
  try { await pool.end(); } catch { /* ignore */ }
  process.exit(1);
});
