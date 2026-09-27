const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { getDb } = require('../db');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/profiles/:uid
router.get('/:uid', [param('uid').trim().notEmpty().isLength({ max: 50 })], validate, (req, res) => {
  const db = getDb();
  const profile = db.prepare(`
    SELECT p.*, s.title as sens_title, s.playstyle as sens_playstyle, s.device_type as sens_device,
      s.fps_sensitivity, s.ads_sensitivity, s.scope_3x, s.scope_4x, s.sniper_scope, s.gyroscope,
      h.title as hud_title, h.playstyle as hud_playstyle, h.device_type as hud_device,
      h.fire_button_size, h.fire_button_position, h.joystick_size, h.hud_layout
    FROM player_profiles p
    LEFT JOIN sensitivity_presets s ON p.sensitivity_preset_id = s.id
    LEFT JOIN hud_settings h ON p.hud_preset_id = h.id
    WHERE p.uid = ?
  `).get(req.params.uid);

  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  if (profile.hud_layout) {
    try { profile.hud_layout = JSON.parse(profile.hud_layout); } catch { profile.hud_layout = {}; }
  }
  res.json(profile);
});

// POST /api/profiles — create or update by uid
router.post('/', [
  body('uid').trim().notEmpty().isLength({ max: 50 }),
  body('username').optional().trim().isLength({ max: 100 }),
  body('sensitivity_preset_id').optional({ nullable: true }).isInt(),
  body('hud_preset_id').optional({ nullable: true }).isInt(),
  body('notes').optional().trim().isLength({ max: 500 }),
], validate, (req, res) => {
  const db = getDb();
  const { uid, username, sensitivity_preset_id, hud_preset_id, notes } = req.body;

  const existing = db.prepare('SELECT id FROM player_profiles WHERE uid = ?').get(uid);
  if (existing) {
    db.prepare(`UPDATE player_profiles SET username=?, sensitivity_preset_id=?, hud_preset_id=?, notes=?, updated_at=? WHERE uid=?`)
      .run(username || null, sensitivity_preset_id || null, hud_preset_id || null, notes || null, new Date().toISOString(), uid);
    return res.json({ uid, updated: true });
  }

  db.prepare('INSERT INTO player_profiles (uid, username, sensitivity_preset_id, hud_preset_id, notes) VALUES (?,?,?,?,?)')
    .run(uid, username || null, sensitivity_preset_id || null, hud_preset_id || null, notes || null);
  res.status(201).json({ uid, created: true });
});

// DELETE /api/profiles/:uid
router.delete('/:uid', [param('uid').trim().notEmpty()], validate, (req, res) => {
  const result = getDb().prepare('DELETE FROM player_profiles WHERE uid = ?').run(req.params.uid);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
