# FitTrack
Needs Node 18+ and a running MongoDB (local, or an Atlas URI).

## Run
Backend:  cd server && cp .env.example .env && npm install && npm run dev
Frontend: cd client && npm install && npm run dev   (opens http://localhost:5173)

The Vite dev server proxies /api to http://localhost:5000.
