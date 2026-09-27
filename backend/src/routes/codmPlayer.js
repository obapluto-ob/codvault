const express = require('express');
const { param, validationResult } = require('express-validator');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const { randomUUID } = require('crypto');
const CODASHOP_URL = 'https://order-sg.codashop.com/validate';
const VOUCHER_TYPE = 'CALL_OF_DUTY_MOBILE_WL';
const WHITE_LABEL_ID = '1';

async function fetchCodmPlayer(userId, country = 'US') {
  const deviceId = randomUUID();
  const res = await fetch(CODASHOP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country, voucherTypeName: VOUCHER_TYPE, whiteLabelId: WHITE_LABEL_ID, deviceId, userId }),
  });
  if (!res.ok) throw new Error(`Codashop HTTP ${res.status}`);
  const data = await res.json();
  // Handle country redirect
  if (data.errorCode === -200 && data.homeBaseCountry2Name) {
    return fetchCodmPlayer(userId, data.homeBaseCountry2Name);
  }
  if (!data.result || data.result.result !== 0) return null;
  const r = data.result;
  return {
    uid: userId,
    nickname: r.nickname,
    level: r.level,
    levelImageUrl: r.customLevelImageUrl,
    avatar: r.picUrl || null,
    shortId: r.shortId,
    country: r.country || country,
    countryId: r.countryId,
    rank: {
      class: r.rankClass,
      label: r.customReadableMpRank,
      imageUrl: r.customMpRankImageUrl,
      rating: r.rating,
    },
  };
}

// GET /api/codm-player/:uid
router.get('/:uid', [
  param('uid').trim().notEmpty().isLength({ max: 50 }),
], validate, async (req, res) => {
  try {
    const player = await fetchCodmPlayer(req.params.uid);
    if (!player) return res.status(404).json({ error: 'Player not found. Check your UID.' });
    res.json(player);
  } catch (e) {
    console.error('CODM player lookup failed:', e.message);
    res.status(502).json({ error: 'Could not reach CODM player service. Try again.' });
  }
});

module.exports = router;
