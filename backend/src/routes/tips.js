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

// GET /api/tips
router.get('/', [
  query('category').optional().isString().trim(),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  query('q').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
], validate, (req, res) => {
  const db = getDb();
  const { category, difficulty, q, page = 1, limit = 20 } = req.query;
  let sql = 'SELECT id, title, slug, category, difficulty, tags, created_at FROM tips WHERE 1=1';
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (difficulty) { sql += ' AND difficulty = ?'; params.push(difficulty); }
  if (q) { sql += ' AND (title LIKE ? OR content LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  const total = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(params).count;
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);
  const tips = db.prepare(sql).all(params).map(t => ({ ...t, tags: JSON.parse(t.tags) }));
  res.json({ data: tips, total, page, limit, pages: Math.ceil(total / limit) });
});

// GET /api/tips/:slug
router.get('/:slug', (req, res) => {
  const tip = getDb().prepare('SELECT * FROM tips WHERE slug = ?').get(req.params.slug);
  if (!tip) return res.status(404).json({ error: 'Not found' });
  res.json({ ...tip, tags: JSON.parse(tip.tags) });
});

// POST /api/tips (admin)
router.post('/', requireAdmin, [
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/),
  body('category').trim().notEmpty().isLength({ max: 50 }),
  body('content').trim().notEmpty(),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('tags').optional().isArray(),
], validate, (req, res) => {
  const db = getDb();
  const { title, slug, category, content, difficulty = 'beginner', tags = [] } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO tips (title, slug, category, content, difficulty, tags) VALUES (?,?,?,?,?,?)'
    ).run(title, slug, category, content, difficulty, JSON.stringify(tags));
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Slug already exists' });
    throw e;
  }
});

// PUT /api/tips/:id (admin)
router.put('/:id', requireAdmin, [param('id').isInt()], validate, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM tips WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const fields = ['title', 'slug', 'category', 'content', 'difficulty'];
  const updates = { updated_at: new Date().toISOString() };
  fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  if (req.body.tags !== undefined) updates.tags = JSON.stringify(req.body.tags);
  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE tips SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), req.params.id);
  res.json({ success: true });
});

// DELETE /api/tips/:id (admin)
router.delete('/:id', requireAdmin, [param('id').isInt()], validate, (req, res) => {
  const result = getDb().prepare('DELETE FROM tips WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
