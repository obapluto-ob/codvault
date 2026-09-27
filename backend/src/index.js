require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const codesRouter = require('./routes/codes');
const weaponsRouter = require('./routes/weapons');
const tipsRouter = require('./routes/tips');
const settingsRouter = require('./routes/settings');
const searchRouter = require('./routes/search');
const profilesRouter = require('./routes/profiles');
const codmPlayerRouter = require('./routes/codmPlayer');
const tournamentsRouter = require('./routes/tournaments');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
    ].filter(Boolean);
    if (!origin || allowed.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });

app.use('/api/', apiLimiter);
app.use('/api/codes', codesRouter);
app.use('/api/weapons', weaponsRouter);
app.use('/api/tips', tipsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/search', searchRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/codm-player', codmPlayerRouter);
app.use('/api/tournaments', tournamentsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Admin token verification
app.get('/api/admin/verify', (req, res) => {
  const crypto = require('crypto');
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'codvault-admin-secret-change-in-production';
  const auth = req.headers.authorization?.replace('Bearer ', '') || '';
  try {
    const valid = auth.length === ADMIN_TOKEN.length &&
      crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(ADMIN_TOKEN));
    if (valid) return res.json({ ok: true });
  } catch {}
  res.status(401).json({ error: 'Invalid token' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`CODVault API running on port ${PORT}`));
