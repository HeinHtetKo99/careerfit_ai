# CareerFit AI

AI-powered resume-to-job matcher. Upload a CV, paste a job description, and get an instant match score with skill gaps and actionable feedback. Supports **English** and **Myanmar (မြန်မာ)**.

## Features

- **Resume analysis** — Upload a PDF; text is extracted and parsed for skills and experience
- **Job matching** — Compare your resume against any pasted job description
- **Match score** — 0–100 score with matched and missing skills
- **AI feedback** — Improvement tips and career coaching via Google Gemini
- **Match history** — Dashboard to browse and revisit past analyses
- **Saved resume** — Upload once; reuse your CV for multiple job analyses
- **CV snapshot** — Experience, education, summary, and key skills on each result
- **Improvement roadmap** — 3-phase AI plan: quick wins, skill gaps, and CV polish
- **Bilingual UI** — English and Myanmar for labels, feedback, and coaching text
- **User accounts** — Register, log in, and keep your analysis history (JWT auth)

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| AI | Google Gemini API |
| Auth | JWT, bcrypt |

## Project structure

```
careerfit-ai/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/            # API client (auth, matches)
│   │   ├── components/     # UI components
│   │   ├── context/        # Auth & language state
│   │   ├── i18n/           # English & Myanmar strings
│   │   └── pages/          # Analyze, Dashboard, Login, etc.
│   └── public/             # Logo, favicons
├── server/                 # Express API
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth, upload, errors
│   ├── migrations/         # SQL migrations
│   ├── routes/             # API routes
│   ├── services/           # Gemini AI & local fallback parser
│   ├── schema.sql          # Database schema
│   └── uploads/            # Uploaded PDFs (gitignored)
└── package.json            # Root dev scripts
```

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+
- **Google Gemini API key** — [Get one at Google AI Studio](https://aistudio.google.com/apikey)

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/careerfit-ai.git
cd careerfit-ai
npm run install:all
```

### 2. Set up the database

Create a PostgreSQL database, then run the schema and migrations:

```bash
psql "$DATABASE_URL" -f server/schema.sql
psql "$DATABASE_URL" -f server/migrations/002_analyze_flow.sql
psql "$DATABASE_URL" -f server/migrations/003_saved_resume.sql
psql "$DATABASE_URL" -f server/migrations/004_resume_file_name.sql
psql "$DATABASE_URL" -f server/migrations/005_improvement_roadmap.sql
psql "$DATABASE_URL" -f server/migrations/006_match_language.sql
psql "$DATABASE_URL" -f server/migrations/007_content_i18n.sql
```

### 3. Configure environment variables

**Server** — copy `server/.env.example` to `server/.env`:

```bash
cp server/.env.example server/.env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens (use a long random string in production) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Comma-separated models to try, e.g. `gemini-2.5-flash,gemini-2.0-flash` |
| `GEMINI_FALLBACK` | Set to `true` to use keyword matching when Gemini is unavailable |
| `PORT` | API port (default `5001`) |

**Client** (optional for local dev) — copy `client/.env.example` to `client/.env`:

```bash
cp client/.env.example client/.env
```

In development, Vite proxies `/api` to `http://localhost:5001`, so `VITE_API_URL` is optional locally. Set it when the frontend talks to a remote API (e.g. production builds).

### 4. Run locally

Start the API and frontend in separate terminals:

```bash
# Terminal 1 — API
npm run dev:server

# Terminal 2 — frontend
npm run dev:client
```

- Frontend: http://localhost:5173  
- API: http://localhost:5001  
- Health check: http://localhost:5001/api/health  

## API reference

All routes are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | — | Server health |
| `GET` | `/health/gemini` | — | Gemini API availability |
| `POST` | `/auth/register` | — | Create account (`name`, `email`, `password`) |
| `POST` | `/auth/login` | — | Log in (`email`, `password`) |
| `POST` | `/resumes/upload` | JWT | Upload or replace your saved PDF resume |
| `GET` | `/resumes/primary` | JWT | Get your saved primary resume |
| `POST` | `/analyze` | JWT | Analyze resume + job description (multipart) |
| `GET` | `/matches/:userId` | JWT | List matches for the authenticated user |
| `DELETE` | `/matches/:userId` | JWT | Delete all analysis history for the authenticated user |
| `GET` | `/matches/detail/:matchId` | JWT | Get a single match result |

**Analyze** expects `multipart/form-data`:

- `resume` — PDF file (max 10 MB); optional if `use_saved_resume=true`
- `use_saved_resume` — set to `true` to analyze your saved primary resume without re-uploading
- `job_description` — required, min 50 characters
- `job_title` — optional
- `language` — `en` or `my`

## Deployment

The app has two parts: a static frontend (`client/`) and a Node API (`server/`).

**Typical setup**

1. **Database** — Supabase, Neon, or Railway PostgreSQL; run `schema.sql` and migrations
2. **API** — Render, Railway, or Fly.io (`server/`, start: `npm start`)
3. **Frontend** — Vercel, Netlify, or Cloudflare Pages (`client/`, build: `npm run build`, output: `dist`)

Set `VITE_API_URL` to your deployed API URL when building the frontend.

> **Note:** Uploaded PDFs are stored in `server/uploads/`. Ephemeral hosts may lose files on restart; use persistent storage or object storage for production.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install client and server dependencies |
| `npm run dev:client` | Start Vite dev server |
| `npm run dev:server` | Start API with nodemon |
| `cd client && npm run build` | Production frontend build |
| `cd server && npm start` | Run API in production |

## License

Private project — all rights reserved.
