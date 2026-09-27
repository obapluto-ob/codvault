const crypto = require('crypto');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'codvault-admin-secret-change-in-production';

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.slice(7);
  const valid = crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(ADMIN_TOKEN)
  );
  if (!valid) return res.status(403).json({ error: 'Forbidden' });
  next();
}

module.exports = { requireAdmin };
