# Deployment Guide

## Backend → Railway or Render (required — SQLite can't run on Vercel)

1. Push repo to GitHub
2. Create new project on [Railway](https://railway.app) or [Render](https://render.com)
3. Set root directory to `backend`
4. Start command: `npm start`
5. Set environment variables:
   ```
   ADMIN_TOKEN=<strong-random-secret>
   FRONTEND_URL=https://your-app.vercel.app
   CHALLONGE_API_KEY=<your-key>
   CHALLONGE_USERNAME=<your-username>
   ```
6. Note your backend URL e.g. `https://codvault-api.railway.app`

## Frontend → Vercel

1. Import repo on [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set environment variable:
   ```
   VITE_API_URL=https://codvault-api.railway.app
   ```
6. Deploy

## Local Dev

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

No `VITE_API_URL` needed locally — Vite proxies `/api` to `localhost:3001` automatically.
