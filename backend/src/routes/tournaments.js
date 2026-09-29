const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { requireAdmin } = require('../middleware/auth');
const { getDb } = require('../db');

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

// ── GET /api/tournaments
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

// ── GET /api/tournaments/:id
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

// ── POST /api/tournaments (admin)
router.post('/', requireAdmin, [
  body('name').trim().notEmpty().isLength({ max: 60 }),
  body('tournament_type').optional().isIn(['single elimination', 'double elimination', 'round robin', 'swiss']),
  body('game_mode').optional().isIn(['mp', 'br', 'blackout']),
], validate, async (req, res) => {
  try {
    const {
      name, tournament_type = 'single elimination',
      game_name = 'Call of Duty: Mobile', description,
      open_signup, signup_cap, start_at, game_mode = 'mp',
    } = req.body;
    const data = await challonge('/tournaments.json', {
      method: 'POST',
      body: {
        tournament: {
          name,
          tournament_type,
          game_name: `${game_name} (${game_mode.toUpperCase()})`,
          description: description || '',
          open_signup: open_signup ?? true,
          accept_attachments: false,
          ...(signup_cap ? { signup_cap } : {}),
          ...(start_at ? { start_at } : {}),
        },
      },
    });
    res.status(201).json({ ...data.tournament, game_mode });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── POST /api/tournaments/:id/register
router.post('/:id/register', [
  param('id').notEmpty(),
  body('name').trim().notEmpty().isLength({ max: 60 }),
  body('codm_uid').trim().notEmpty().isLength({ max: 50 }),
  // BR team fields (optional)
  body('team_name').optional().trim().isLength({ max: 60 }),
  body('team_uids').optional().isArray({ max: 3 }),
], validate, async (req, res) => {
  try {
    const { name, codm_uid, team_name, team_uids = [] } = req.body;
    const isTeam = !!team_name;
    const participantName = isTeam
      ? `${team_name} [${codm_uid}]`
      : `${name} [${codm_uid}]`;
    const miscData = isTeam
      ? JSON.stringify({ uid: codm_uid, team: team_name, members: [codm_uid, ...team_uids] })
      : codm_uid;

    const data = await challonge(`/tournaments/${req.params.id}/participants.json`, {
      method: 'POST',
      body: {
        participant: {
          name: participantName,
          misc: miscData,
        },
      },
    });
    res.status(201).json({ success: true, participant: data.participant });
  } catch (e) {
    if (e.message.includes('already')) return res.status(409).json({ error: 'Already registered' });
    res.status(502).json({ error: e.message });
  }
});

// ── DELETE /api/tournaments/:id/participants/:pid (admin)
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

// ── POST /api/tournaments/:id/start (admin)
router.post('/:id/start', requireAdmin, [param('id').notEmpty()], validate, async (req, res) => {
  try {
    const tourn = await challonge(`/tournaments/${req.params.id}.json`);
    const count = tourn.tournament.participants_count ?? 0;
    if (count < 2) {
      return res.status(422).json({ error: `Need at least 2 participants. Currently have ${count}.` });
    }
    const data = await challonge(`/tournaments/${req.params.id}/start.json`, { method: 'POST' });
    res.json(data.tournament);
  } catch (e) {
    res.status(e.message.includes('Need at least') ? 422 : 502).json({ error: e.message });
  }
});

// ── GET /api/tournaments/:id/matches
router.get('/:id/matches', [param('id').notEmpty()], validate, async (req, res) => {
  try {
    const data = await challonge(`/tournaments/${req.params.id}/matches.json`);
    const matches = (data || []).map(m => m.match);

    // Attach our local stats to each match
    const db = getDb();
    const statsRows = db.prepare(
      'SELECT * FROM match_stats WHERE challonge_tournament_id = ?'
    ).all(String(req.params.id));
    const statsMap = Object.fromEntries(statsRows.map(s => [s.challonge_match_id, s]));

    res.json({ data: matches.map(m => ({ ...m, stats: statsMap[m.id] || null })) });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── PUT /api/tournaments/:id/matches/:mid (admin) — report result + stats
router.put('/:id/matches/:mid', requireAdmin, [
  param('id').notEmpty(),
  param('mid').notEmpty(),
  body('winner_id').notEmpty(),
  body('scores_csv').optional().isString().trim(),
  body('game_mode').optional().isIn(['mp', 'br', 'blackout']),
  body('p1_kills').optional().isInt({ min: 0 }),
  body('p1_damage').optional().isInt({ min: 0 }),
  body('p1_placement').optional().isInt({ min: 1 }),
  body('p2_kills').optional().isInt({ min: 0 }),
  body('p2_damage').optional().isInt({ min: 0 }),
  body('p2_placement').optional().isInt({ min: 1 }),
  body('mvp_participant_id').optional().isInt(),
  body('mvp_name').optional().trim().isLength({ max: 60 }),
  body('screenshot_url').optional().trim().isURL(),
  body('notes').optional().trim().isLength({ max: 500 }),
], validate, async (req, res) => {
  try {
    const {
      winner_id, scores_csv,
      game_mode = 'mp',
      p1_kills, p1_damage, p1_placement,
      p2_kills, p2_damage, p2_placement,
      mvp_participant_id, mvp_name,
      screenshot_url, notes,
    } = req.body;

    // Build scores_csv automatically if not provided
    let finalScores = scores_csv;
    if (!finalScores) {
      if (game_mode === 'mp') {
        finalScores = `${p1_kills ?? 1}-${p2_kills ?? 0}`;
      } else {
        // BR: use placement as score (lower = better)
        finalScores = `${p1_placement ?? 1}-${p2_placement ?? 2}`;
      }
    }

    // Report to Challonge
    const data = await challonge(`/tournaments/${req.params.id}/matches/${req.params.mid}.json`, {
      method: 'PUT',
      body: { match: { winner_id, scores_csv: finalScores } },
    });

    // Save detailed stats to our DB
    const db = getDb();
    const existing = db.prepare(
      'SELECT id FROM match_stats WHERE challonge_match_id = ?'
    ).get(Number(req.params.mid));

    if (existing) {
      db.prepare(`
        UPDATE match_stats SET
          winner_id=?, scores_csv=?, game_mode=?,
          p1_kills=?, p1_damage=?, p1_placement=?,
          p2_kills=?, p2_damage=?, p2_placement=?,
          mvp_participant_id=?, mvp_name=?, screenshot_url=?, notes=?,
          reported_at=datetime('now')
        WHERE challonge_match_id=?
      `).run(
        winner_id, finalScores, game_mode,
        p1_kills ?? null, p1_damage ?? null, p1_placement ?? null,
        p2_kills ?? null, p2_damage ?? null, p2_placement ?? null,
        mvp_participant_id ?? null, mvp_name ?? null, screenshot_url ?? null, notes ?? null,
        Number(req.params.mid)
      );
    } else {
      db.prepare(`
        INSERT INTO match_stats (
          challonge_tournament_id, challonge_match_id,
          winner_id, scores_csv, game_mode,
          p1_kills, p1_damage, p1_placement,
          p2_kills, p2_damage, p2_placement,
          mvp_participant_id, mvp_name, screenshot_url, notes
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        String(req.params.id), Number(req.params.mid),
        winner_id, finalScores, game_mode,
        p1_kills ?? null, p1_damage ?? null, p1_placement ?? null,
        p2_kills ?? null, p2_damage ?? null, p2_placement ?? null,
        mvp_participant_id ?? null, mvp_name ?? null, screenshot_url ?? null, notes ?? null
      );
    }

    res.json({ ...data.match, stats: db.prepare('SELECT * FROM match_stats WHERE challonge_match_id=?').get(Number(req.params.mid)) });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── GET /api/tournaments/:id/stats — leaderboard across all matches
router.get('/:id/stats', [param('id').notEmpty()], validate, async (req, res) => {
  try {
    const db = getDb();
    const stats = db.prepare(
      'SELECT * FROM match_stats WHERE challonge_tournament_id = ? ORDER BY reported_at DESC'
    ).all(String(req.params.id));
    res.json({ data: stats });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/tournaments/:id/finalize (admin)
router.post('/:id/finalize', requireAdmin, [param('id').notEmpty()], validate, async (req, res) => {
  try {
    const data = await challonge(`/tournaments/${req.params.id}/finalize.json`, { method: 'POST' });
    res.json(data.tournament);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

module.exports = router;
