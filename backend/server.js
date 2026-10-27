require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, initDatabase, pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const AUTH_SECRET = process.env.AUTH_SECRET || 'nsl-subcity-auth-secret-key-2024';

// ----------------- CORS Configuration -----------------
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

app.use(express.json({ limit: '12mb' }));

// Support both /api/<route> and direct /<route> (e.g. /beneficiaries -> /api/beneficiaries)
app.use((req, _res, next) => {
  const directRoutes = ['/beneficiaries', '/custom-fields', '/auth', '/health', '/reset-demo', '/users'];
  if (directRoutes.some(route => req.url === route || req.url.startsWith(route + '/') || req.url.startsWith(route + '?'))) {
    req.url = '/api' + req.url;
  }
  next();
});

// ----------------- Auth Token Helper -----------------
function createSessionToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    woreda: user.woreda,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifySessionToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function requireStaff(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const payload = token ? verifySessionToken(token) : null;
  if (!payload) {
    return res.status(401).json({ error: 'እባክዎ ይግቡ። ምዝገባ እና መዝገብ ለገቡ ሰራተኞች ብቻ ናቸው።' });
  }
  req.staff = payload;
  next();
}

// ----------------- Row Mappers (PostgreSQL -> Frontend) -----------------
function mapRowToBeneficiary(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    subCity: row.sub_city,
    woreda: row.woreda,
    blockZone: row.block_zone,
    locality: row.locality || '',
    houseNo: row.house_no || '',
    faydaId: row.fayda_id,
    gender: row.gender,
    age: Number(row.age),
    healthStatus: row.health_status,
    familyMale: Number(row.family_male),
    familyFemale: Number(row.family_female),
    familyTotal: Number(row.family_total),
    phone: row.phone,
    category: row.category,
    registrationDate: row.registration_date ? new Date(row.registration_date).toISOString().split('T')[0] : undefined,
    customFields: row.custom_fields || {}
  };
}

function mapRowToCustomField(row) {
  return {
    id: row.id,
    labelAm: row.label_am,
    labelEn: row.label_en,
    type: row.type,
    options: row.options || [],
    required: Boolean(row.required),
    defaultValue: row.default_value
  };
}

// ----------------- REST API Endpoints -----------------

// 0. Welcome & Root Endpoint
app.get(['/', '/api'], (req, res) => {
  res.json({
    status: 'ok',
    message: 'Nifas Silk-Lafto Beneficiary and Fayda Registry API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      beneficiaries: '/api/beneficiaries',
      importBeneficiaries: '/api/beneficiaries/import',
      customFields: '/api/custom-fields',
      auth: '/api/auth/me'
    }
  });
});

// 1. Health Check
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await query('SELECT NOW() as now;');
    res.json({
      status: 'ok',
      database: 'connected',
      serverTime: dbRes.rows[0].now,
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: err.message
    });
  }
});

function beneficiaryWhere(query) {
  const conditions = [];
  const values = [];

  const search = query.search && String(query.search).trim();
  if (search) {
    values.push(`%${search}%`);
    const idx = values.length;
    conditions.push(`(
      full_name ILIKE $${idx} OR
      fayda_id ILIKE $${idx} OR
      phone ILIKE $${idx} OR
      locality ILIKE $${idx} OR
      house_no ILIKE $${idx}
    )`);
  }

  if (query.woreda && query.woreda !== 'ሁሉም ወረዳዎች' && query.woreda !== 'all') {
    values.push(query.woreda);
    conditions.push(`woreda = $${values.length}`);
  }

  if (query.healthStatus && query.healthStatus !== 'ሁሉም የጤና ሁኔታዎች' && query.healthStatus !== 'all') {
    values.push(query.healthStatus);
    conditions.push(`health_status = $${values.length}`);
  }

  if (query.category && query.category !== 'ሁሉም መደቦች' && query.category !== 'all') {
    values.push(query.category);
    conditions.push(`category = $${values.length}`);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values
  };
}

// 2. Beneficiaries: GET /api/beneficiaries/stats (aggregates, no row dump)
app.get('/api/beneficiaries/stats', requireStaff, async (_req, res) => {
  try {
    const grouped = await query(`
      SELECT
        GROUPING(woreda) AS g_woreda,
        GROUPING(health_status) AS g_health,
        GROUPING(gender) AS g_gender,
        GROUPING(category) AS g_category,
        woreda,
        health_status,
        gender,
        category,
        COUNT(*)::int AS count,
        COALESCE(SUM(family_total), 0)::int AS family_total,
        COALESCE(MAX(id), 0)::int AS max_id
      FROM beneficiaries
      GROUP BY GROUPING SETS ((), (woreda), (health_status), (gender), (category));
    `);

    const groupedFlag = (value) => Number(value) === 0;
    const totalRow = grouped.rows.find((item) =>
      !groupedFlag(item.g_woreda) && !groupedFlag(item.g_health) && !groupedFlag(item.g_gender) && !groupedFlag(item.g_category)
    ) || {};
    const total = Number(totalRow.count) || 0;
    const male = Number(grouped.rows.find((item) => groupedFlag(item.g_gender) && item.gender === 'ወ')?.count) || 0;
    const female = Number(grouped.rows.find((item) => groupedFlag(item.g_gender) && item.gender === 'ሴ')?.count) || 0;
    const workforce = Number(grouped.rows.find((item) => groupedFlag(item.g_category) && item.category === 'ሰሪ ሀይል')?.count) || 0;
    const continuous = Number(grouped.rows.find((item) => groupedFlag(item.g_category) && item.category === 'በቀጣይነት የሚረዱ')?.count) || 0;
    const malePercentage = total > 0 ? Math.round((male / total) * 100) : 0;

    res.json({
      totalBeneficiaries: total,
      workforceCount: workforce,
      continuousCount: continuous,
      totalFamilyMembers: totalRow.family_total || 0,
      maleBeneficiaries: male,
      femaleBeneficiaries: female,
      averageFamilySize: total > 0 ? Number(((totalRow.family_total || 0) / total).toFixed(1)) : 0,
      nextId: (totalRow.max_id || 0) + 1,
      woredaDistribution: grouped.rows
        .filter((item) => groupedFlag(item.g_woreda))
        .sort((a, b) => Number(b.count) - Number(a.count))
        .map((item) => ({
          woreda: item.woreda,
          count: Number(item.count),
          percentage: total > 0 ? Math.round((Number(item.count) / total) * 100) : 0
        })),
      healthDistribution: grouped.rows
        .filter((item) => groupedFlag(item.g_health))
        .sort((a, b) => Number(b.count) - Number(a.count))
        .map((item) => ({
          condition: item.health_status,
          count: Number(item.count),
          percentage: total > 0 ? Math.round((Number(item.count) / total) * 100) : 0
        })),
      genderRatio: {
        male,
        female,
        malePercentage,
        femalePercentage: total > 0 ? 100 - malePercentage : 0
      }
    });
  } catch (err) {
    console.error('Error fetching beneficiary stats:', err);
    res.status(500).json({ error: 'Failed to fetch beneficiary stats' });
  }
});

const REPORT_DIMENSIONS = {
  woreda: `COALESCE(NULLIF(TRIM(woreda), ''), 'ያልተገለጸ')`,
  category: `COALESCE(NULLIF(TRIM(category), ''), 'ያልተገለጸ')`,
  gender: `CASE WHEN gender = 'ወ' THEN 'ወንድ' WHEN gender = 'ሴ' THEN 'ሴት' ELSE 'ያልተገለጸ' END`,
  health: `CASE
    WHEN TRIM(health_status) IN ('ጤነኛ', 'አካል ጉዳት', 'ልብ ድካም', 'ታማሚ', 'ውስጥ ደዌ', 'የስኳር ህመም', 'የደም ግፊት')
      THEN TRIM(health_status)
    ELSE 'ሌላ'
  END`,
  age_band: `CASE
    WHEN age IS NULL OR age <= 0 THEN 'ያልተገለጸ'
    WHEN age < 18 THEN 'ከ18 በታች'
    WHEN age < 30 THEN '18–29'
    WHEN age < 45 THEN '30–44'
    WHEN age < 60 THEN '45–59'
    ELSE '60 እና በላይ'
  END`,
  block_zone: `COALESCE(NULLIF(TRIM(block_zone), ''), 'ያልተገለጸ')`,
  locality: `COALESCE(NULLIF(TRIM(locality), ''), 'ያልተገለጸ')`,
  aid_type: `COALESCE(NULLIF(TRIM(custom_fields->>'aidType'), ''), 'ያልተሞላ')`,
  education: `COALESCE(NULLIF(TRIM(custom_fields->>'educationLevel'), ''), 'ያልተሞላ')`,
  registration_year: `COALESCE(TO_CHAR(registration_date, 'YYYY'), 'ያልተገለጸ')`
};

const REPORT_METRICS = {
  count: { expr: 'COUNT(*)::int', kind: 'sum' },
  family: { expr: 'COALESCE(SUM(family_total), 0)::int', kind: 'sum' },
  family_male: { expr: 'COALESCE(SUM(family_male), 0)::int', kind: 'sum' },
  family_female: { expr: 'COALESCE(SUM(family_female), 0)::int', kind: 'sum' },
  avg_age: { expr: 'ROUND(AVG(NULLIF(age, 0))::numeric, 1)', kind: 'avg' },
  avg_family: { expr: 'ROUND(AVG(family_total)::numeric, 1)', kind: 'avg' }
};

function reportDimensionSql(key, values) {
  if (!key) return null;
  if (String(key).startsWith('field:')) {
    const id = String(key).slice(6);
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) return null;
    values.push(id);
    return `COALESCE(NULLIF(TRIM(custom_fields->>$${values.length}), ''), 'ያልተሞላ')`;
  }
  return REPORT_DIMENSIONS[key] || null;
}

function foldReportParts(parts, kind) {
  const ranked = [...parts].sort((a, b) => b.people - a.people);
  if (ranked.length <= 5) return ranked;
  const keep = ranked.slice(0, 5);
  const rest = ranked.slice(5);
  if (kind === 'avg') return keep;
  const people = rest.reduce((sum, part) => sum + part.people, 0);
  const value = rest.reduce((sum, part) => sum + part.value, 0);
  if (people > 0) keep.push({ key: 'ሌሎች', value, people });
  return keep;
}

function reportRowTotal(parts, kind) {
  if (kind === 'avg') {
    const people = parts.reduce((sum, part) => sum + part.people, 0);
    if (!people) return 0;
    return Math.round((parts.reduce((sum, part) => sum + part.value * part.people, 0) / people) * 10) / 10;
  }
  return parts.reduce((sum, part) => sum + part.value, 0);
}

// 2a. Beneficiaries: GET /api/beneficiaries/report (one grouped comparison)
app.get('/api/beneficiaries/report', requireStaff, async (req, res) => {
  try {
    const groupBy = String(req.query.groupBy || 'woreda');
    const splitBy = String(req.query.splitBy || 'none');
    const metricKey = REPORT_METRICS[req.query.metric] ? String(req.query.metric) : 'count';
    const metric = REPORT_METRICS[metricKey];
    const top = Math.min(20, Math.max(5, parseInt(req.query.top, 10) || 10));
    const values = [];
    const groupSql = reportDimensionSql(groupBy, values);
    const splitSql = splitBy !== 'none' ? reportDimensionSql(splitBy, values) : null;

    if (!groupSql || (splitBy !== 'none' && !splitSql) || groupBy === splitBy) {
      return res.status(400).json({ error: 'የሪፖርት ምርጫው ትክክል አይደለም' });
    }

    const result = await query(
      `
      SELECT
        ${groupSql} AS group_label,
        ${splitSql || `''`} AS split_label,
        COUNT(*)::int AS people,
        ${metric.expr} AS metric_value
      FROM beneficiaries
      GROUP BY 1, 2;
      `,
      values
    );

    const buckets = new Map();
    result.rows.forEach((row) => {
      const label = row.group_label || 'ያልተገለጸ';
      const key = splitSql ? (row.split_label || 'ያልተገለጸ') : '';
      const people = Number(row.people) || 0;
      const value = Number(row.metric_value) || 0;
      if (!buckets.has(label)) buckets.set(label, { label, people: 0, parts: [] });
      const bucket = buckets.get(label);
      bucket.people += people;
      bucket.parts.push({ key, value, people });
    });

    let rows = [...buckets.values()].sort((a, b) => b.people - a.people);
    let truncated = false;
    if (rows.length > top) {
      const rest = rows.slice(top);
      rows = rows.slice(0, top);
      truncated = true;
      if (metric.kind === 'sum') {
        const other = { label: 'ሌሎች', people: 0, parts: [] };
        rest.forEach((row) => {
          other.people += row.people;
          row.parts.forEach((part) => {
            const existing = other.parts.find((item) => item.key === part.key);
            if (existing) {
              existing.value += part.value;
              existing.people += part.people;
            } else {
              other.parts.push({ ...part });
            }
          });
        });
        if (other.people > 0) rows.push(other);
      }
    }

    const shaped = rows.map((row) => {
      const parts = splitSql
        ? foldReportParts(row.parts, metric.kind).filter((part) => part.key)
        : [];
      const total = splitSql
        ? reportRowTotal(parts.length ? parts : row.parts, metric.kind)
        : reportRowTotal(row.parts, metric.kind);
      return {
        label: row.label,
        people: row.people,
        total,
        parts: parts.map((part) => ({ key: part.key, value: part.value }))
      };
    });

    const series = [];
    shaped.forEach((row) => {
      row.parts.forEach((part) => {
        if (!series.includes(part.key)) series.push(part.key);
      });
    });

    res.json({
      groupBy,
      splitBy: splitSql ? splitBy : 'none',
      metric: metricKey,
      truncated,
      series,
      rows: shaped
    });
  } catch (err) {
    console.error('Error building beneficiary report:', err);
    res.status(500).json({ error: 'ሪፖርቱን ማዘጋጀት አልተቻለም' });
  }
});

// 2b. Beneficiaries: GET /api/beneficiaries (one page, plus filters)
app.get('/api/beneficiaries', requireStaff, async (req, res) => {
  try {
    const { whereClause, values } = beneficiaryWhere(req.query);
    const exportAll = req.query.export === '1';
    const pageSize = exportAll
      ? null
      : Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 40));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const listValues = [...values];
    let sql;
    if (exportAll) {
      sql = `SELECT * FROM beneficiaries ${whereClause} ORDER BY id DESC;`;
    } else {
      const limitIdx = listValues.length + 1;
      const offsetIdx = listValues.length + 2;
      listValues.push(pageSize, (page - 1) * pageSize);
      sql = `
        SELECT page_rows.*, totals.total
        FROM (
          SELECT * FROM beneficiaries ${whereClause}
          ORDER BY id DESC
          LIMIT $${limitIdx} OFFSET $${offsetIdx}
        ) page_rows
        RIGHT JOIN (
          SELECT COUNT(*)::int AS total FROM beneficiaries ${whereClause}
        ) totals ON TRUE;
      `;
    }

    const result = await query(sql, listValues);
    const rows = exportAll ? result.rows : result.rows.filter((row) => row.id != null);
    const total = exportAll ? rows.length : (result.rows[0]?.total || 0);

    res.json({
      records: rows.map(mapRowToBeneficiary),
      total,
      page: exportAll ? 1 : page,
      pageSize: exportAll ? total : pageSize
    });
  } catch (err) {
    console.error('Error fetching beneficiaries:', err);
    res.status(500).json({ error: 'Failed to fetch beneficiaries from database' });
  }
});

// 3. Beneficiaries: POST /api/beneficiaries (Register a new beneficiary)
app.post('/api/beneficiaries', requireStaff, async (req, res) => {
  try {
    const b = req.body;
    if (!b.fullName || !b.faydaId || !b.phone) {
      return res.status(400).json({ error: 'ሙሉ ስም፣ የፋይዳ መታወቂያ እና ስልክ ቁጥር ማስገባት ግዴታ ነው (Full name, Fayda ID, and phone are required)' });
    }

    const cleanFayda = String(b.faydaId).trim();

    // Check duplicate Fayda ID in database
    const existing = await query('SELECT id FROM beneficiaries WHERE fayda_id = $1 LIMIT 1;', [cleanFayda]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'ይህ የፋይዳ ቁጥር ቀደም ሲል ተመዝግቧል (Fayda ID is already registered)' });
    }

    const fullName = String(b.fullName).trim();
    const subCity = b.subCity || 'ንፋስ ስልክ ላፍቶ';
    const woreda = b.woreda || 'ለቡ 01';
    const blockZone = b.blockZone || 'ቀጠና 1';
    const locality = b.locality ? String(b.locality).trim() : '';
    const houseNo = b.houseNo ? String(b.houseNo).trim() : '';
    const gender = b.gender || 'ወ';
    const age = Number(b.age) || 0;
    const healthStatus = b.healthStatus || 'ጤነኛ';
    const familyMale = Number(b.familyMale) || 0;
    const familyFemale = Number(b.familyFemale) || 0;
    const familyTotal = Number(b.familyTotal) || (familyMale + familyFemale);
    const phone = String(b.phone).trim();
    const category = b.category || 'በቀጣይነት የሚረዱ';
    const registrationDate = b.registrationDate || new Date().toISOString().split('T')[0];
    const customFields = typeof b.customFields === 'object' && b.customFields !== null ? b.customFields : {};

    const result = await query(
      `
      INSERT INTO beneficiaries (
        full_name, sub_city, woreda, block_zone, locality, house_no,
        fayda_id, gender, age, health_status, family_male, family_female,
        family_total, phone, category, registration_date, custom_fields
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *;
      `,
      [
        fullName,
        subCity,
        woreda,
        blockZone,
        locality,
        houseNo,
        cleanFayda,
        gender,
        age,
        healthStatus,
        familyMale,
        familyFemale,
        familyTotal,
        phone,
        category,
        registrationDate,
        JSON.stringify(customFields)
      ]
    );

    const saved = mapRowToBeneficiary(result.rows[0]);
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error inserting beneficiary to PostgreSQL:', err);
    res.status(500).json({ error: err.message || 'Failed to save beneficiary to database' });
  }
});

function normalizeImportPhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('251') && digits.length === 12) digits = `0${digits.slice(3)}`;
  if (digits.length === 9 && digits.startsWith('9')) digits = `0${digits}`;
  return digits;
}

function normalizeImportDate(raw) {
  const text = String(raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = new Date(text);
  if (text && !Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return new Date().toISOString().split('T')[0];
}

function normalizeImportGender(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (['ሴ', 'ሴት', 'f', 'female', 'woman'].includes(value) || value.startsWith('ሴ')) return 'ሴ';
  return 'ወ';
}

function normalizeImportCategory(raw) {
  const trimmed = String(raw || '').trim();
  const value = trimmed.toLowerCase();
  if (trimmed === 'ሰሪ ሀይል' || value.includes('ሰሪ') || value.includes('workforce') || value.includes('worker')) {
    return 'ሰሪ ሀይል';
  }
  return 'በቀጣይነት የሚረዱ';
}

// 3b. Beneficiaries: POST /api/beneficiaries/import (bulk Excel import)
app.post('/api/beneficiaries/import', requireStaff, async (req, res) => {
  const incoming = req.body?.records;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return res.status(400).json({ error: 'የሚገባ መዝገብ አልተገኘም (No records to import)' });
  }
  if (incoming.length > 5000) {
    return res.status(400).json({ error: 'በአንድ ጊዜ ከ5,000 መዝገቦች በላይ ማስገባት አይቻልም' });
  }

  const prepared = [];
  const rejected = [];
  const seen = new Set();

  incoming.forEach((b, index) => {
    const row = Number(b.sourceRow) || index + 1;
    const fullName = String(b.fullName || '').trim();
    const faydaId = String(b.faydaId || '').replace(/\D/g, '');
    const phone = normalizeImportPhone(b.phone);

    if (!fullName || !faydaId || !phone) {
      rejected.push({ row, faydaId, reason: 'ሙሉ ስም፣ የፋይዳ መታወቂያ እና ስልክ ቁጥር ያስፈልጋሉ' });
      return;
    }
    if (!/^\d{16}$/.test(faydaId)) {
      rejected.push({ row, faydaId, reason: 'የፋይዳ ቁጥር ልክ 16 ድጅት መሆን አለበት' });
      return;
    }
    if (phone.length < 9 || phone.length > 13) {
      rejected.push({ row, faydaId, reason: 'ስልክ ቁጥሩ ትክክል አይመስልም' });
      return;
    }
    if (seen.has(faydaId)) {
      rejected.push({ row, faydaId, reason: 'በፋይሉ ውስጥ የተደገመ የፋይዳ ቁጥር' });
      return;
    }
    seen.add(faydaId);

    const familyMale = Number(b.familyMale) || 0;
    const familyFemale = Number(b.familyFemale) || 0;
    prepared.push({
      row,
      fullName,
      subCity: b.subCity || 'ንፋስ ስልክ ላፍቶ',
      woreda: b.woreda || 'ለቡ 01',
      blockZone: b.blockZone || 'ቀጠና 1',
      locality: b.locality ? String(b.locality).trim() : '',
      houseNo: b.houseNo ? String(b.houseNo).trim() : '',
      faydaId,
      gender: normalizeImportGender(b.gender),
      age: Number(b.age) || 0,
      healthStatus: b.healthStatus || 'ጤነኛ',
      familyMale,
      familyFemale,
      familyTotal: Number(b.familyTotal) || (familyMale + familyFemale),
      phone,
      category: normalizeImportCategory(b.category),
      registrationDate: normalizeImportDate(b.registrationDate),
      customFields: typeof b.customFields === 'object' && b.customFields !== null ? b.customFields : {}
    });
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const created = [];
    const skipped = [];

    for (const b of prepared) {
      const result = await client.query(
        `
        INSERT INTO beneficiaries (
          full_name, sub_city, woreda, block_zone, locality, house_no,
          fayda_id, gender, age, health_status, family_male, family_female,
          family_total, phone, category, registration_date, custom_fields
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (fayda_id) DO NOTHING
        RETURNING *;
        `,
        [
          b.fullName,
          b.subCity,
          b.woreda,
          b.blockZone,
          b.locality,
          b.houseNo,
          b.faydaId,
          b.gender,
          b.age,
          b.healthStatus,
          b.familyMale,
          b.familyFemale,
          b.familyTotal,
          b.phone,
          b.category,
          b.registrationDate,
          JSON.stringify(b.customFields)
        ]
      );

      if (result.rows.length === 0) {
        skipped.push({ row: b.row, faydaId: b.faydaId, reason: 'ይህ የፋይዳ ቁጥር ቀደም ሲል ተመዝግቧል' });
      } else {
        created.push(mapRowToBeneficiary(result.rows[0]));
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ created, skipped, rejected });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error importing beneficiaries:', err);
    res.status(500).json({ error: err.message || 'ከ Excel ማስገባት አልተሳካም' });
  } finally {
    client.release();
  }
});

// 4. Beneficiaries: PUT /api/beneficiaries/:id (Update beneficiary)
app.put('/api/beneficiaries/:id', requireStaff, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const b = req.body;

    const result = await query(
      `
      UPDATE beneficiaries
      SET
        full_name = $1,
        sub_city = $2,
        woreda = $3,
        block_zone = $4,
        locality = $5,
        house_no = $6,
        fayda_id = $7,
        gender = $8,
        age = $9,
        health_status = $10,
        family_male = $11,
        family_female = $12,
        family_total = $13,
        phone = $14,
        category = $15,
        custom_fields = $16,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *;
      `,
      [
        b.fullName,
        b.subCity || 'ንፋስ ስልክ ላፍቶ',
        b.woreda,
        b.blockZone,
        b.locality || '',
        b.houseNo || '',
        b.faydaId,
        b.gender,
        Number(b.age) || 0,
        b.healthStatus,
        Number(b.familyMale) || 0,
        Number(b.familyFemale) || 0,
        Number(b.familyTotal) || 0,
        b.phone,
        b.category,
        JSON.stringify(b.customFields || {}),
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Beneficiary record not found' });
    }

    res.json(mapRowToBeneficiary(result.rows[0]));
  } catch (err) {
    console.error('Error updating beneficiary in PostgreSQL:', err);
    res.status(500).json({ error: 'Failed to update beneficiary in database' });
  }
});

// 5. Beneficiaries: DELETE /api/beneficiaries/:id (Delete beneficiary)
app.delete('/api/beneficiaries/:id', requireStaff, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await query('DELETE FROM beneficiaries WHERE id = $1 RETURNING id;', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Beneficiary record not found' });
    }
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting beneficiary from PostgreSQL:', err);
    res.status(500).json({ error: 'Failed to delete beneficiary from database' });
  }
});

// 6. Custom Fields: GET /api/custom-fields
app.get('/api/custom-fields', requireStaff, async (req, res) => {
  try {
    const result = await query('SELECT * FROM custom_fields ORDER BY sort_order ASC, created_at ASC;');
    res.json(result.rows.map(mapRowToCustomField));
  } catch (err) {
    // Fallback to custom_form_fields if exists
    try {
      const fallback = await query('SELECT * FROM custom_form_fields ORDER BY sort_order ASC, created_at ASC;');
      return res.json(fallback.rows.map(mapRowToCustomField));
    } catch {
      res.status(500).json({ error: 'Failed to fetch custom fields' });
    }
  }
});

// 7. Custom Fields: POST /api/custom-fields
app.post('/api/custom-fields', requireStaff, async (req, res) => {
  try {
    const f = req.body;
    const maxOrder = await query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM custom_fields;');
    const nextOrder = maxOrder.rows[0].next_order;

    const result = await query(
      `
      INSERT INTO custom_fields (id, label_am, label_en, type, options, required, default_value, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        label_am = EXCLUDED.label_am,
        label_en = EXCLUDED.label_en,
        type = EXCLUDED.type,
        options = EXCLUDED.options,
        required = EXCLUDED.required,
        default_value = EXCLUDED.default_value
      RETURNING *;
      `,
      [
        f.id,
        f.labelAm,
        f.labelEn,
        f.type,
        f.options || [],
        Boolean(f.required),
        f.defaultValue !== undefined ? String(f.defaultValue) : null,
        nextOrder
      ]
    );

    // Keep custom_form_fields table in sync
    await query(
      `
      INSERT INTO custom_form_fields (id, label_am, label_en, type, options, required, default_value, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING;
      `,
      [f.id, f.labelAm, f.labelEn, f.type, f.options || [], Boolean(f.required), f.defaultValue || null, nextOrder]
    ).catch(() => {});

    res.status(201).json(mapRowToCustomField(result.rows[0]));
  } catch (err) {
    console.error('Error creating custom field:', err);
    res.status(500).json({ error: 'Failed to create custom field' });
  }
});

// 8. Custom Fields: DELETE /api/custom-fields/:id
app.delete('/api/custom-fields/:id', requireStaff, async (req, res) => {
  try {
    const id = req.params.id;
    await query('DELETE FROM custom_fields WHERE id = $1;', [id]);
    await query('DELETE FROM custom_form_fields WHERE id = $1;', [id]).catch(() => {});
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting custom field:', err);
    res.status(500).json({ error: 'Failed to delete custom field' });
  }
});

// 9. Custom Fields: PUT /api/custom-fields/reorder
app.put('/api/custom-fields/reorder', requireStaff, async (req, res) => {
  try {
    const { fieldIds } = req.body;
    if (Array.isArray(fieldIds)) {
      for (let i = 0; i < fieldIds.length; i++) {
        await query('UPDATE custom_fields SET sort_order = $1 WHERE id = $2;', [i, fieldIds[i]]);
        await query('UPDATE custom_form_fields SET sort_order = $1 WHERE id = $2;', [i, fieldIds[i]]).catch(() => {});
      }
    }
    const result = await query('SELECT * FROM custom_fields ORDER BY sort_order ASC;');
    res.json(result.rows.map(mapRowToCustomField));
  } catch (err) {
    console.error('Error reordering custom fields:', err);
    res.status(500).json({ error: 'Failed to reorder custom fields' });
  }
});

// 10. Reset demo is disabled so the imported registry cannot be wiped from the UI.
app.post('/api/reset-demo', (_req, res) => {
  res.status(410).json({ error: 'የናሙና መረጃ መመለስ ተዘግቷል።' });
});

// 11. Authentication: Login Handler (shared by /api/auth/login and /api/login)
const handleLogin = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'የተጠቃሚ ስም እና የይለፍ ቃል ያስፈልጋል (Username and password are required)' });
    }

    const cleanInput = String(usernameOrEmail).trim().toLowerCase();
    const envAdminUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const envAdminPass = process.env.ADMIN_PASSWORD || '123321123';

    // 1. Check against admins table in Neon DB
    let userRow = null;
    try {
      const dbRes = await query(
        'SELECT * FROM admins WHERE LOWER(username) = $1 OR LOWER(email) = $1 LIMIT 1;',
        [cleanInput]
      );
      if (dbRes.rows.length > 0) {
        userRow = dbRes.rows[0];
      }
    } catch {
      // Try fallback to admin_users table
      const fallbackRes = await query(
        'SELECT * FROM admin_users WHERE LOWER(username) = $1 OR LOWER(email) = $1 LIMIT 1;',
        [cleanInput]
      ).catch(() => ({ rows: [] }));
      if (fallbackRes.rows.length > 0) {
        userRow = fallbackRes.rows[0];
      }
    }

    // Verify bcrypt hash from database
    if (userRow) {
      const isMatch = await bcrypt.compare(password, userRow.password_hash);
      if (isMatch) {
        const user = {
          id: userRow.id,
          username: userRow.username,
          fullName: userRow.full_name,
          email: userRow.email,
          role: (userRow.role === 'admin' || userRow.role === 'super_admin') ? 'admin' : 'user',
          woreda: userRow.woreda
        };
        const token = createSessionToken(user);
        return res.json({ success: true, token, user });
      }
    }

    // 2. Also check against configured ADMIN_USERNAME and ADMIN_PASSWORD
    if (cleanInput === envAdminUser && password === envAdminPass) {
      const user = {
        id: userRow ? userRow.id : 1,
        username: 'admin',
        fullName: 'ዋና አስተዳዳሪ (System Administrator)',
        email: 'admin@nslsubcity.gov.et',
        role: 'admin',
        woreda: 'ዋና መ/ቤት'
      };
      const token = createSessionToken(user);
      return res.json({ success: true, token, user });
    }

    return res.status(401).json({ error: 'የተጠቃሚ ስም ወይም የይለፍ ቃል ትክክል አይደለም (Invalid username or password)' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'የመግቢያ ሂደት አልተሳካም (Login failed)' });
  }
};

// Route aliases
app.post('/api/auth/login', handleLogin);
app.post('/api/login', handleLogin);

// 12. Authentication: Get Current Session User
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'ያልተፈቀደ መዳረሻ (Unauthorized)' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifySessionToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'የክፍለ ጊዜው አልቋል ወይም ልክ ያልሆነ ማስረጃ ነው (Session expired or invalid)' });
    }

    let user = null;
    const dbRes = await query('SELECT id, username, full_name, email, role, woreda FROM admins WHERE id = $1;', [payload.id]).catch(() => ({ rows: [] }));
    if (dbRes.rows.length > 0) {
      const r = dbRes.rows[0];
      user = {
        id: r.id,
        username: r.username,
        fullName: r.full_name,
        email: r.email,
        role: (r.role === 'admin' || r.role === 'super_admin') ? 'admin' : 'user',
        woreda: r.woreda
      };
    } else {
      user = {
        id: payload.id,
        username: payload.username,
        fullName: payload.username === 'admin' ? 'ዋና አስተዳዳሪ' : 'የመረጃ መዝጋቢ',
        email: `${payload.username}@nslsubcity.gov.et`,
        role: (payload.role === 'admin' || payload.role === 'super_admin') ? 'admin' : 'user',
        woreda: payload.woreda || 'ዋና መ/ቤት'
      };
    }

    res.json({ user });
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 13. Authentication: Logout
app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// 14. User Management: GET /api/users (Admin Only)
app.get('/api/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'ያልተፈቀደ መዳረሻ (Unauthorized)' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifySessionToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'የክፍለ ጊዜው አልቋል (Session expired)' });
    }
    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      return res.status(403).json({ error: 'ይህንን ለማድረግ የአስተዳዳሪ ፈቃድ ያስፈልጋል (Admin privileges required)' });
    }

    const result = await query(
      'SELECT id, username, full_name, email, role, woreda, created_at FROM admins ORDER BY id ASC;'
    );
    const users = result.rows.map(r => ({
      id: r.id,
      username: r.username,
      fullName: r.full_name,
      email: r.email,
      role: (r.role === 'admin' || r.role === 'super_admin') ? 'admin' : 'user',
      woreda: r.woreda,
      createdAt: r.created_at
    }));
    res.json(users);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'ተጠቃሚዎችን ማምጣት አልተቻለም' });
  }
});

// 15. User Management: POST /api/users (Create User - Admin Only)
app.post('/api/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'ያልተፈቀደ መዳረሻ (Unauthorized)' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifySessionToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'super_admin')) {
      return res.status(403).json({ error: 'ይህንን ለማድረግ የአስተዳዳሪ ፈቃድ ያስፈልጋል (Admin privileges required)' });
    }

    const { username, fullName, email, password, role = 'user', woreda = 'ለቡ 01' } = req.body;
    if (!username || !fullName || !email || !password) {
      return res.status(400).json({ error: 'ሙሉ መረጃዎችን (ስም፣ የተጠቃሚ ስም፣ ኢሜይል እና የይለፍ ቃል) ያስገቡ' });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const normalizedEmail = String(email).trim().toLowerCase();

    // Check duplicate
    const existing = await query(
      'SELECT id FROM admins WHERE LOWER(username) = $1 OR LOWER(email) = $2 LIMIT 1;',
      [normalizedUsername, normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'ይህ የተጠቃሚ ስም ወይም ኢሜይል አስቀድሞ ተመዝግቧል (Username or email already exists)' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role === 'admin' ? 'admin' : 'user';

    const insertRes = await query(
      `INSERT INTO admins (username, full_name, email, password_hash, role, woreda)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, full_name, email, role, woreda, created_at;`,
      [normalizedUsername, fullName.trim(), normalizedEmail, passwordHash, assignedRole, woreda]
    );

    const newUser = insertRes.rows[0];
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.full_name,
      email: newUser.email,
      role: newUser.role,
      woreda: newUser.woreda,
      createdAt: newUser.created_at
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'አዲስ ተጠቃሚ መፍጠር አልተቻለም' });
  }
});

// 16. User Management: DELETE /api/users/:id (Delete User - Admin Only)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'ያልተፈቀደ መዳረሻ (Unauthorized)' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifySessionToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'super_admin')) {
      return res.status(403).json({ error: 'ይህንን ለማድረግ የአስተዳዳሪ ፈቃድ ያስፈልጋል' });
    }

    const targetId = parseInt(req.params.id, 10);
    if (targetId === payload.id) {
      return res.status(400).json({ error: 'ራስዎን መሰረዝ አይችሉም (Cannot delete your own account)' });
    }

    await query('DELETE FROM admins WHERE id = $1;', [targetId]);
    res.json({ success: true, message: 'ተጠቃሚው ተሰርዟል' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'ተጠቃሚውን መሰረዝ አልተቻለም' });
  }
});

// 404 Catch-All Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}. Visit / for available endpoints.`
  });
});

// ----------------- Server Start -----------------
app.listen(PORT, async () => {
  console.log(`========================================================`);
  console.log(`🚀 NSL Fayda Registry Backend running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Beneficiaries: http://localhost:${PORT}/api/beneficiaries`);
  console.log(`========================================================`);

  try {
    await initDatabase();
  } catch (err) {
    console.error('Database migration failed on startup:', err);
  }
});
