require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, initDatabase } = require('./db');
const { INITIAL_BENEFICIARIES, INITIAL_CUSTOM_FIELDS } = require('./initialData');

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

app.use(express.json());

// Support both /api/<route> and direct /<route> (e.g. /beneficiaries -> /api/beneficiaries)
app.use((req, _res, next) => {
  const directRoutes = ['/beneficiaries', '/custom-fields', '/auth', '/health', '/reset-demo'];
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

// 2. Beneficiaries: GET /api/beneficiaries (search & filter support)
app.get('/api/beneficiaries', async (req, res) => {
  try {
    const { search, woreda, healthStatus, category } = req.query;

    const conditions = [];
    const values = [];

    if (search && String(search).trim()) {
      values.push(`%${String(search).trim()}%`);
      const idx = values.length;
      conditions.push(`(
        full_name ILIKE $${idx} OR 
        fayda_id ILIKE $${idx} OR 
        phone ILIKE $${idx} OR 
        locality ILIKE $${idx} OR 
        house_no ILIKE $${idx}
      )`);
    }

    if (woreda && woreda !== 'ሁሉም ወረዳዎች') {
      values.push(woreda);
      conditions.push(`woreda = $${values.length}`);
    }

    if (healthStatus && healthStatus !== 'ሁሉም የጤና ሁኔታዎች') {
      values.push(healthStatus);
      conditions.push(`health_status = $${values.length}`);
    }

    if (category && category !== 'ሁሉም መደቦች') {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM beneficiaries ${whereClause} ORDER BY id DESC;`;

    const result = await query(sql, values);
    res.json(result.rows.map(mapRowToBeneficiary));
  } catch (err) {
    console.error('Error fetching beneficiaries:', err);
    res.status(500).json({ error: 'Failed to fetch beneficiaries from database' });
  }
});

// 3. Beneficiaries: POST /api/beneficiaries (Register a new beneficiary)
app.post('/api/beneficiaries', async (req, res) => {
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

// 4. Beneficiaries: PUT /api/beneficiaries/:id (Update beneficiary)
app.put('/api/beneficiaries/:id', async (req, res) => {
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
app.delete('/api/beneficiaries/:id', async (req, res) => {
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
app.get('/api/custom-fields', async (req, res) => {
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
app.post('/api/custom-fields', async (req, res) => {
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
app.delete('/api/custom-fields/:id', async (req, res) => {
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
app.put('/api/custom-fields/reorder', async (req, res) => {
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

// 10. POST /api/reset-demo
app.post('/api/reset-demo', async (req, res) => {
  try {
    await query('TRUNCATE TABLE beneficiaries RESTART IDENTITY;');

    for (const b of INITIAL_BENEFICIARIES) {
      await query(
        `
        INSERT INTO beneficiaries (
          id, full_name, sub_city, woreda, block_zone, locality, house_no,
          fayda_id, gender, age, health_status, family_male, family_female,
          family_total, phone, category, registration_date, custom_fields
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (fayda_id) DO NOTHING;
        `,
        [
          b.id, b.fullName, b.subCity, b.woreda, b.blockZone, b.locality, b.houseNo,
          b.faydaId, b.gender, b.age, b.healthStatus, b.familyMale, b.familyFemale,
          b.familyTotal, b.phone, b.category, b.registrationDate || new Date().toISOString().split('T')[0],
          JSON.stringify(b.customFields || {})
        ]
      );
    }

    await query(`SELECT setval('beneficiaries_id_seq', COALESCE((SELECT MAX(id) FROM beneficiaries), 1));`);

    const records = (await query('SELECT * FROM beneficiaries ORDER BY id DESC;')).rows.map(mapRowToBeneficiary);
    const fields = (await query('SELECT * FROM custom_fields ORDER BY sort_order ASC;')).rows.map(mapRowToCustomField);

    res.json({ success: true, records, customFields: fields });
  } catch (err) {
    console.error('Error resetting demo data:', err);
    res.status(500).json({ error: 'Failed to reset demo data' });
  }
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
          role: userRow.role,
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
        role: 'super_admin',
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
      user = { id: r.id, username: r.username, fullName: r.full_name, email: r.email, role: r.role, woreda: r.woreda };
    } else {
      user = { id: payload.id, username: payload.username, fullName: 'ዋና አስተዳዳሪ', email: 'admin@nslsubcity.gov.et', role: payload.role, woreda: payload.woreda };
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
