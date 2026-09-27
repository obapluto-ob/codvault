const express = require('express');
const { query, validationResult } = require('express-validator');
const { getDb } = require('../db');

const router = express.Router();

// GET /api/search?q=...
router.get('/', [
  query('q').trim().notEmpty().isLength({ min: 2, max: 100 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const db = getDb();
  const { q } = req.query;
  const like = `%${q}%`;

  const codes = db.prepare(
    'SELECT id, code, reward, status, platform, category FROM redeem_codes WHERE code LIKE ? OR reward LIKE ? LIMIT 5'
  ).all(like, like);

  const weapons = db.prepare(
    'SELECT id, name, slug, category FROM weapons WHERE name LIKE ? OR description LIKE ? LIMIT 5'
  ).all(like, like);

  const tips = db.prepare(
    'SELECT id, title, slug, category, difficulty FROM tips WHERE title LIKE ? OR content LIKE ? LIMIT 5'
  ).all(like, like);

  res.json({ codes, weapons, tips, query: q });
});

module.exports = router;
