require('dotenv').config();
const path = require('path');
const express = require('express');
const { Pool } = require('pg');
const { createAdminRouter } = require('./routes/admin');

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(express.json());
app.use(express.static(path.resolve(__dirname, '..')));

async function withAuditUser(username, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (username) {
      await client.query("SELECT set_config('app.username', $1, true)", [username]);
    }
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS server_time');
    res.json({ ok: true, serverTime: rows[0].server_time });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ ok: false, error: 'Database connection failed' });
  }
});

app.use('/api/admin', createAdminRouter({ pool, withAuditUser }));

app.listen(port, () => {
  console.log(`Hope ERP server running at http://localhost:${port}`);
});
