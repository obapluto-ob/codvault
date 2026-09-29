const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const BASE = 'https://api.challonge.com/v1';

function getKey() {
  const key = process.env.CHALLONGE_API_KEY;
  if (!key) throw new Error('CHALLONGE_API_KEY not configured');
  return key;
}

async function challonge(path, opts = {}) {
  const key = getKey();
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('api_key', key);

  const res = await fetch(url.toString(), {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json();
  if (data.errors) throw new Error(data.errors.join(', '));
  if (!res.ok) throw new Error(`Challonge HTTP ${res.status}`);
  return data;
}

// ── GET /api/tournaments — list all your tournaments
router.get('/', async (req, res) => {
  try {
    const data = await challonge('/tournaments.json?state=all');
    const tournaments = (data || []).map(t => t.tournament).sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );
    res.json({ data: tournaments, total: tournaments.length });
  } catch (e) {
    const noKey = e.message.includes('not configured');
    res.status(noKey ? 503 : 502).json({ error: e.message, data: [], total: 0 });
  }
});

// ── GET /api/tournaments/:id — tournament detail + participants
router.get('/:id', [param('id').notEmpty()], validate, async (req, res) => {
  try {
    const [tourn, parts] = await Promise.all([
      challonge(`/tournaments/${req.params.id}.json?include_participants=1&include_matches=1`),
      challonge(`/tournaments/${req.params.id}/participants.json`),
    ]);
    const tournament = tourn.tournament;
    const participants = (parts || []).map(p => p.participant);
    res.json({ ...tournament, participants });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── POST /api/tournaments — admin creates a tournament
router.post('/', requireAdmin, [
  body('name').trim().notEmpty().isLength({ max: 60 }),
  body('tournament_type').optional().isIn(['single elimination', 'double elimination', 'round robin', 'swiss']),
  body('game_name').optional().trim(),
], validate, async (req, res) => {
  try {
    const { name, tournament_type = 'single elimination', game_name = 'Call of Duty: Mobile', description, open_signup } = req.body;
    const data = await challonge('/tournaments.json', {
      method: 'POST',
      body: {
        tournament: {
          name,
          tournament_type,
          game_name,
          description: description || '',
          open_signup: open_signup ?? true,
          accept_attachments: false,
        },
      },
    });
    res.status(201).json(data.tournament);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── POST /api/tournaments/:id/register — public player registration
router.post('/:id/register', [
  param('id').notEmpty(),
  body('name').trim().notEmpty().isLength({ max: 60 }),
  body('codm_uid').trim().notEmpty().isLength({ max: 50 }),
], validate, async (req, res) => {
  try {
    const { name, codm_uid } = req.body;
    const data = await challonge(`/tournaments/${req.params.id}/participants.json`, {
      method: 'POST',
      body: {
        participant: {
          name: `${name} [${codm_uid}]`,
          misc: codm_uid,
        },
      },
    });
    res.status(201).json({ success: true, participant: data.participant });
  } catch (e) {
    if (e.message.includes('already')) return res.status(409).json({ error: 'Already registered' });
    res.status(502).json({ error: e.message });
  }
});

// ── DELETE /api/tournaments/:id/participants/:pid — admin removes participant
router.delete('/:id/participants/:pid', requireAdmin, [
  param('id').notEmpty(),
  param('pid').notEmpty(),
], validate, async (req, res) => {
  try {
    await challonge(`/tournaments/${req.params.id}/participants/${req.params.pid}.json`, { method: 'DELETE' });
    res.json({ success: true });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── POST /api/tournaments/:id/start — admin starts tournament
router.post('/:id/start', requireAdmin, [param('id').notEmpty()], validate, async (req, res) => {
  try {
    // Check participant count before attempting to start
    const tourn = await challonge(`/tournaments/${req.params.id}.json`);
    const count = tourn.tournament.participants_count ?? 0;
    if (count < 2) {
      return res.status(422).json({ error: `Need at least 2 participants to start. Currently have ${count}.` });
    }
    const data = await challonge(`/tournaments/${req.params.id}/start.json`, { method: 'POST' });
    res.json(data.tournament);
  } catch (e) {
    const status = e.message.includes('Need at least') ? 422 : 502;
    res.status(status).json({ error: e.message });
  }
});

// ── GET /api/tournaments/:id/matches — list matches
router.get('/:id/matches', [param('id').notEmpty()], validate, async (req, res) => {
  try {
    const data = await challonge(`/tournaments/${req.params.id}/matches.json`);
    const matches = (data || []).map(m => m.match);
    res.json({ data: matches });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── PUT /api/tournaments/:id/matches/:mid — admin reports match result
router.put('/:id/matches/:mid', requireAdmin, [
  param('id').notEmpty(),
  param('mid').notEmpty(),
  body('winner_id').notEmpty(),
  body('scores_csv').optional().isString().trim(),
], validate, async (req, res) => {
  try {
    const { winner_id, scores_csv = '1-0' } = req.body;
    const data = await challonge(`/tournaments/${req.params.id}/matches/${req.params.mid}.json`, {
      method: 'PUT',
      body: { match: { winner_id, scores_csv } },
    });
    res.json(data.match);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── POST /api/tournaments/:id/finalize — admin finalizes tournament
router.post('/:id/finalize', requireAdmin, [param('id').notEmpty()], validate, async (req, res) => {
  try {
    const data = await challonge(`/tournaments/${req.params.id}/finalize.json`, { method: 'POST' });
    res.json(data.tournament);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

module.exports = router;
