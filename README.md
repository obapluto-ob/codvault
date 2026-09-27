# CODVault — Call of Duty: Mobile Hub

Production-ready web app for CODM resources: redeem codes, weapon loadouts, sensitivity settings, HUD guides and more.

## Stack
- **Frontend**: React + Vite + Tailwind CSS + React Query
- **Backend**: Node.js + Express + SQLite (better-sqlite3)

## Quick Start

### 1. Backend
```bash
cd backend
npm install
npm run dev        # runs on http://localhost:3001
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev        # runs on http://localhost:5173
```

## Admin Dashboard
Visit `/admin` and enter the token from `backend/.env`:
```
ADMIN_TOKEN=codvault-admin-secret-change-in-production
```
**Change this token before deploying to production.**

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/codes | List redeem codes (filter: status, platform, category, q) |
| POST | /api/codes | Add code (admin) |
| PUT | /api/codes/:id | Update code (admin) |
| DELETE | /api/codes/:id | Delete code (admin) |
| GET | /api/weapons | List weapons |
| GET | /api/weapons/:slug | Weapon detail + loadouts |
| POST | /api/weapons | Add weapon (admin) |
| POST | /api/weapons/:id/loadouts | Add loadout (admin) |
| GET | /api/tips | List guides |
| GET | /api/tips/:slug | Guide detail |
| POST | /api/tips | Add guide (admin) |
| GET | /api/settings/sensitivity | Sensitivity presets |
| GET | /api/settings/hud | HUD presets |
| GET | /api/search?q= | Global search |
| GET | /api/health | Health check |

## Database
SQLite file is auto-created at `backend/data/codvault.db` on first run. No setup needed.

## Production Deployment
1. Set `ADMIN_TOKEN` to a strong random secret in `backend/.env`
2. Set `FRONTEND_URL` to your production domain
3. Build frontend: `cd frontend && npm run build`
4. Serve `frontend/dist` with nginx or a static host
5. Run backend with `npm start` behind a reverse proxy
