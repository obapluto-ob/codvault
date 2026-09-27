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

// GET /api/weapons
router.get('/', [
  query('category').optional().isString().trim(),
  query('q').optional().isString().trim(),
], validate, (req, res) => {
  const db = getDb();
  const { category, q } = req.query;
  let sql = 'SELECT * FROM weapons WHERE 1=1';
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (q) { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY category, name';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/weapons/:slug
router.get('/:slug', (req, res) => {
  const db = getDb();
  const weapon = db.prepare('SELECT * FROM weapons WHERE slug = ?').get(req.params.slug);
  if (!weapon) return res.status(404).json({ error: 'Not found' });
  const loadouts = db.prepare('SELECT * FROM loadouts WHERE weapon_id = ? ORDER BY playstyle').all(weapon.id);
  loadouts.forEach(l => {
    l.attachments = JSON.parse(l.attachments);
    l.perks = JSON.parse(l.perks);
  });
  res.json({ ...weapon, loadouts });
});

// POST /api/weapons (admin)
router.post('/', requireAdmin, [
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/),
  body('category').trim().notEmpty().isLength({ max: 50 }),
  body('description').optional().isString().trim(),
  body('base_damage').optional().isInt({ min: 0, max: 100 }),
  body('fire_rate').optional().isInt({ min: 0, max: 100 }),
  body('range').optional().isInt({ min: 0, max: 100 }),
  body('mobility').optional().isInt({ min: 0, max: 100 }),
  body('control').optional().isInt({ min: 0, max: 100 }),
], validate, (req, res) => {
  const db = getDb();
  const { name, slug, category, description, base_damage, fire_rate, range, mobility, control, image_url } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO weapons (name, slug, category, description, base_damage, fire_rate, range, mobility, control, image_url) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).run(name, slug, category, description || null, base_damage || null, fire_rate || null, range || null, mobility || null, control || null, image_url || null);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Slug already exists' });
    throw e;
  }
});

// PUT /api/weapons/:id (admin)
router.put('/:id', requireAdmin, [param('id').isInt()], validate, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM weapons WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const fields = ['name', 'slug', 'category', 'description', 'base_damage', 'fire_rate', 'range', 'mobility', 'control', 'image_url'];
  const updates = { updated_at: new Date().toISOString() };
  fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE weapons SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), req.params.id);
  res.json({ success: true });
});

// DELETE /api/weapons/:id (admin)
router.delete('/:id', requireAdmin, [param('id').isInt()], validate, (req, res) => {
  const result = getDb().prepare('DELETE FROM weapons WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// POST /api/weapons/:id/loadouts (admin)
router.post('/:id/loadouts', requireAdmin, [
  param('id').isInt(),
  body('title').trim().notEmpty(),
  body('playstyle').trim().notEmpty(),
  body('attachments').isArray(),
  body('perks').optional().isArray(),
], validate, (req, res) => {
  const db = getDb();
  const weapon = db.prepare('SELECT id FROM weapons WHERE id = ?').get(req.params.id);
  if (!weapon) return res.status(404).json({ error: 'Weapon not found' });
  const { title, playstyle, description, attachments, perks = [] } = req.body;
  const result = db.prepare(
    'INSERT INTO loadouts (weapon_id, title, playstyle, description, attachments, perks) VALUES (?,?,?,?,?,?)'
  ).run(req.params.id, title, playstyle, description || null, JSON.stringify(attachments), JSON.stringify(perks));
  res.status(201).json({ id: result.lastInsertRowid });
});

// DELETE /api/weapons/loadouts/:loadoutId (admin)
router.delete('/loadouts/:loadoutId', requireAdmin, [param('loadoutId').isInt()], validate, (req, res) => {
  const result = getDb().prepare('DELETE FROM loadouts WHERE id = ?').run(req.params.loadoutId);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
