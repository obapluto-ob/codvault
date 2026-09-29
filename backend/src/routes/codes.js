const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { getDb } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/codes — public sees active/expired only; admin (Authorization header) can see pending too
router.get('/', [
  query('status').optional().isIn(['active', 'expired', 'all', 'pending']),
  query('platform').optional().isString().trim(),
  query('category').optional().isString().trim(),
  query('season').optional().isString().trim(),
  query('q').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], validate, (req, res) => {
  const db = getDb();
  const { status = 'all', platform, category, season, q, page = 1, limit = 20 } = req.query;

  const crypto = require('crypto');
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'codvault-admin-secret-change-in-production';
  const auth = req.headers.authorization?.replace('Bearer ', '') || '';
  const isAdmin = auth.length === ADMIN_TOKEN.length && (() => {
    try { return crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(ADMIN_TOKEN)); } catch { return false; }
  })();

  let sql = 'SELECT * FROM redeem_codes WHERE 1=1';
  const params = [];

  // Non-admins never see pending
  if (!isAdmin) sql += " AND status != 'pending'";

  if (status !== 'all') { sql += ' AND status = ?'; params.push(status); }
  if (platform && platform !== 'all') { sql += ' AND (platform = ? OR platform = "all")'; params.push(platform); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (season) { sql += ' AND season = ?'; params.push(season); }
  if (q) { sql += ' AND (code LIKE ? OR reward LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

  const total = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(params).count;
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  res.json({ data: db.prepare(sql).all(params), total, page, limit, pages: Math.ceil(total / limit) });
});

// POST /api/codes/submit — public code submission (goes to pending)
router.post('/submit', [
  body('code').trim().notEmpty().isLength({ max: 100 }),
  body('reward').trim().notEmpty().isLength({ max: 500 }),
  body('platform').optional().isIn(['all', 'android', 'ios']),
  body('season').optional().isString().trim().isLength({ max: 50 }),
  body('source').optional().isString().trim().isLength({ max: 200 }),
], validate, (req, res) => {
  const db = getDb();
  const { code, reward, platform = 'all', season, source } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO redeem_codes (code, reward, platform, season, category, status, source) VALUES (?,?,?,?,?,?,?)'
    ).run(code.toUpperCase().trim(), reward, platform, season || null, 'general', 'pending', source || 'Community submission');
    res.status(201).json({ id: result.lastInsertRowid, message: 'Submitted for review' });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Code already exists' });
    throw e;
  }
});

// PATCH /api/codes/:id/report — public, marks code as expired
router.patch('/:id/report', [param('id').isInt()], validate, (req, res) => {
  const db = getDb();
  const code = db.prepare('SELECT id, status FROM redeem_codes WHERE id = ?').get(req.params.id);
  if (!code) return res.status(404).json({ error: 'Not found' });
  if (code.status === 'expired') return res.json({ success: true });
  db.prepare('UPDATE redeem_codes SET status = ?, updated_at = ? WHERE id = ?')
    .run('expired', new Date().toISOString(), req.params.id);
  res.json({ success: true });
});

// PATCH /api/codes/:id/approve — admin approves a pending submission
router.patch('/:id/approve', requireAdmin, [param('id').isInt()], validate, (req, res) => {
  const db = getDb();
  const code = db.prepare('SELECT id, status FROM redeem_codes WHERE id = ?').get(req.params.id);
  if (!code) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE redeem_codes SET status = ?, updated_at = ? WHERE id = ?')
    .run('active', new Date().toISOString(), req.params.id);
  res.json({ success: true });
});

// GET /api/codes/:id
router.get('/:id', [param('id').isInt()], validate, (req, res) => {
  const code = getDb().prepare('SELECT * FROM redeem_codes WHERE id = ?').get(req.params.id);
  if (!code) return res.status(404).json({ error: 'Not found' });
  res.json(code);
});

// POST /api/codes (admin)
router.post('/', requireAdmin, [
  body('code').trim().notEmpty().isLength({ max: 100 }),
  body('reward').trim().notEmpty().isLength({ max: 500 }),
  body('platform').optional().isIn(['all', 'android', 'ios']),
  body('season').optional().isString().trim().isLength({ max: 50 }),
  body('category').optional().isString().trim().isLength({ max: 50 }),
  body('status').optional().isIn(['active', 'expired', 'pending']),
  body('expires_at').optional().isISO8601(),
  body('source').optional().isString().trim().isLength({ max: 200 }),
], validate, (req, res) => {
  const db = getDb();
  const { code, reward, platform = 'all', season, category = 'general', status = 'active', expires_at, source } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO redeem_codes (code, reward, platform, season, category, status, expires_at, source) VALUES (?,?,?,?,?,?,?,?)'
    ).run(code.toUpperCase().trim(), reward, platform, season || null, category, status, expires_at || null, source || null);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Code already exists' });
    throw e;
  }
});

// PUT /api/codes/:id (admin)
router.put('/:id', requireAdmin, [
  param('id').isInt(),
  body('code').optional().trim().notEmpty().isLength({ max: 100 }),
  body('reward').optional().trim().notEmpty().isLength({ max: 500 }),
  body('platform').optional().isIn(['all', 'android', 'ios']),
  body('status').optional().isIn(['active', 'expired', 'pending']),
  body('expires_at').optional().isISO8601(),
], validate, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM redeem_codes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const fields = ['code', 'reward', 'platform', 'season', 'category', 'status', 'expires_at', 'source'];
  const updates = {};
  fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  updates.updated_at = new Date().toISOString();
  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE redeem_codes SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), req.params.id);
  res.json({ success: true });
});

// DELETE /api/codes/:id (admin)
router.delete('/:id', requireAdmin, [param('id').isInt()], validate, (req, res) => {
  const result = getDb().prepare('DELETE FROM redeem_codes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
