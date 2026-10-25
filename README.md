# Nifas Silk-Lafto Sub-City Beneficiary & Fayda Registry System

Clean monorepo architecture featuring isolated `/frontend` (React + Vite + Tailwind CSS) and `/backend` (Node.js + Express + PostgreSQL REST API) ready for cloud deployment on Render and Vercel/Netlify.

```
nifas-silk-lafto-beneficiary-&-fayda-registry/
├── frontend/                     # React + Vite + Tailwind CSS Client
│   ├── src/                      # Components, services, types
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── backend/                      # Node.js + Express REST API (Render-ready)
│   ├── server.js                 # Express app, CORS, routes & handlers
│   ├── db.js                     # PostgreSQL connection & auto-migration
│   ├── initialData.js            # Self-contained seeds
│   ├── package.json
│   ├── .env.example
│   ├── .env
│   └── README.md
│
├── package.json                  # Monorepo root workspace scripts
└── README.md
```

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start the Backend API (Port 5000)
```bash
npm run dev:backend
# or
cd backend && npm start
```

### 3. Start the Frontend (Port 3000)
```bash
npm run dev:frontend
# or
cd frontend && npm run dev
```

Visit the application at: `http://localhost:3000`  
Backend API endpoints: `http://localhost:5000/api`

---

## Deploying `/backend` on Render

1. Create a new **Web Service** on [Render Dashboard](https://dashboard.render.com).
2. Connect your GitHub repository.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Environment Variables on Render:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `CORS_ORIGIN`: Your deployed frontend domain or `*`.
   - `AUTH_SECRET`: A secure random secret string.
