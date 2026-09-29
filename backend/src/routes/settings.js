const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { getDb } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/settings/sensitivity
router.get('/sensitivity', [
  query('playstyle').optional().isString().trim(),
  query('device_type').optional().isIn(['phone', 'tablet']),
], validate, (req, res) => {
  const db = getDb();
  const { playstyle, device_type } = req.query;
  let sql = 'SELECT * FROM sensitivity_presets WHERE 1=1';
  const params = [];
  if (playstyle) { sql += ' AND playstyle = ?'; params.push(playstyle); }
  if (device_type) { sql += ' AND device_type = ?'; params.push(device_type); }
  sql += ' ORDER BY playstyle';
  res.json(db.prepare(sql).all(...params));
});

// POST /api/settings/sensitivity (admin)
router.post('/sensitivity', requireAdmin, [
  body('title').trim().notEmpty(),
  body('playstyle').trim().notEmpty(),
  body('device_type').optional().isIn(['phone', 'tablet']),
  body('fps_sensitivity').optional().isInt({ min: 0, max: 300 }),
  body('ads_sensitivity').optional().isInt({ min: 0, max: 300 }),
  body('scope_3x').optional().isInt({ min: 0, max: 300 }),
  body('scope_4x').optional().isInt({ min: 0, max: 300 }),
  body('sniper_scope').optional().isInt({ min: 0, max: 300 }),
  body('gyroscope').optional().isInt({ min: 0, max: 300 }),
], validate, (req, res) => {
  const db = getDb();
  const { title, playstyle, device_type = 'phone', fps_sensitivity, ads_sensitivity, scope_3x, scope_4x, sniper_scope, gyroscope, description } = req.body;
  const result = db.prepare(
    'INSERT INTO sensitivity_presets (title, playstyle, device_type, fps_sensitivity, ads_sensitivity, scope_3x, scope_4x, sniper_scope, gyroscope, description) VALUES (?,?,?,?,?,?,?,?,?,?)'
  ).run(title, playstyle, device_type, fps_sensitivity || null, ads_sensitivity || null, scope_3x || null, scope_4x || null, sniper_scope || null, gyroscope || null, description || null);
  res.status(201).json({ id: result.lastInsertRowid });
});

// DELETE /api/settings/sensitivity/:id (admin)
router.delete('/sensitivity/:id', requireAdmin, (req, res) => {
  const result = getDb().prepare('DELETE FROM sensitivity_presets WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// GET /api/settings/hud
router.get('/hud', [
  query('playstyle').optional().isString().trim(),
  query('device_type').optional().isIn(['phone', 'tablet']),
], validate, (req, res) => {
  const db = getDb();
  const { playstyle, device_type } = req.query;
  let sql = 'SELECT * FROM hud_settings WHERE 1=1';
  const params = [];
  if (playstyle) { sql += ' AND playstyle = ?'; params.push(playstyle); }
  if (device_type) { sql += ' AND device_type = ?'; params.push(device_type); }
  sql += ' ORDER BY playstyle';
  const results = db.prepare(sql).all(...params);
  res.json(results.map(r => ({ ...r, hud_layout: JSON.parse(r.hud_layout) })));
});

// POST /api/settings/hud (admin)
router.post('/hud', requireAdmin, [
  body('title').trim().notEmpty(),
  body('device_type').optional().isIn(['phone', 'tablet']),
  body('playstyle').trim().notEmpty(),
  body('hud_layout').optional().isObject(),
], validate, (req, res) => {
  const db = getDb();
  const { title, device_type = 'phone', playstyle, fire_button_size, fire_button_position, joystick_size, hud_layout = {}, description } = req.body;
  const result = db.prepare(
    'INSERT INTO hud_settings (title, device_type, playstyle, fire_button_size, fire_button_position, joystick_size, hud_layout, description) VALUES (?,?,?,?,?,?,?,?)'
  ).run(title, device_type, playstyle, fire_button_size || null, fire_button_position || null, joystick_size || null, JSON.stringify(hud_layout), description || null);
  res.status(201).json({ id: result.lastInsertRowid });
});

// DELETE /api/settings/hud/:id (admin)
router.delete('/hud/:id', requireAdmin, (req, res) => {
  const result = getDb().prepare('DELETE FROM hud_settings WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
