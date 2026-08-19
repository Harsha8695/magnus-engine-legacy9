'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { buildClientPrompt } = require('./prompts/clients');

// ── Environment ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SESSION_SECRET = process.env.SESSION_SECRET;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'reports.db');
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

if (!ANTHROPIC_API_KEY) {
  console.error('FATAL: ANTHROPIC_API_KEY is not set');
  process.exit(1);
}

if (!SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET is not set');
  process.exit(1);
}

// ── Anthropic client ───────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ── SQLite database ────────────────────────────────────────────────────────────
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id          TEXT PRIMARY KEY,
    client_id   TEXT NOT NULL,
    prompt      TEXT NOT NULL,
    response    TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    created_at  INTEGER NOT NULL,
    completed_at INTEGER
  );
`);

// ── Express app ────────────────────────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ── Routes ─────────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.1.0', ts: Date.now() });
});

// List reports for a client
app.get('/api/reports', (req, res) => {
  const { client_id, limit = 20, offset = 0 } = req.query;
  if (!client_id) {
    return res.status(400).json({ error: 'client_id is required' });
  }
  const rows = db
    .prepare(
      'SELECT id, client_id, status, created_at, completed_at FROM reports WHERE client_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    )
    .all(client_id, Number(limit), Number(offset));
  res.json({ reports: rows });
});

// Get a single report
app.get('/api/reports/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Report not found' });
  res.json(row);
});

// Generate a new report
app.post('/api/reports', async (req, res) => {
  const { client_id, context } = req.body;
  if (!client_id) {
    return res.status(400).json({ error: 'client_id is required' });
  }

  const id = uuidv4();
  const now = Date.now();
  const prompt = buildClientPrompt(client_id, context || {});

  db.prepare(
    'INSERT INTO reports (id, client_id, prompt, status, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, client_id, prompt, 'pending', now);

  res.status(202).json({ id, status: 'pending' });

  // Run inference asynchronously
  (async () => {
    try {
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });
      const response = message.content[0]?.text ?? '';
      db.prepare(
        'UPDATE reports SET response = ?, status = ?, completed_at = ? WHERE id = ?'
      ).run(response, 'completed', Date.now(), id);
    } catch (err) {
      console.error('Anthropic error for report %s: %s', id, err.message);
      db.prepare('UPDATE reports SET status = ? WHERE id = ?').run('failed', id);
    }
  })();
});

// ── Start ──────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log('Magnus Engine v1.1.0 listening on port %d', PORT);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    db.close();
    console.log('Server shut down cleanly');
    process.exit(0);
  });
});

module.exports = app;
