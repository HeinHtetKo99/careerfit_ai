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

- **Node.js** 22
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

Create a PostgreSQL database, then initialize it with the current schema:

```bash
cd server
DATABASE_URL="$DATABASE_URL" npm run db:init
```

The numbered migrations are only for upgrading older installations. Do not run
them after `schema.sql`, which already contains the current schema.

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
| `CLIENT_URL` | Allowed frontend origin; comma-separate multiple origins |
| `PERSIST_UPLOADS` | Set to `false` on ephemeral hosts; resume text remains in PostgreSQL |
| `UPLOADS_DIR` | PDF storage path when uploads are persisted |
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

### Railway deployment

The included `railway.json` builds the React frontend and serves it from the
Express API, so the application needs only one public service plus PostgreSQL:

1. In Railway, create a project from this GitHub repository.
2. Add a PostgreSQL service to the project.
3. Add these variables to the application service:
   - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET` with a long random value
   - `GEMINI_API_KEY` from Google AI Studio
   - `GEMINI_MODEL=gemini-2.5-flash`
   - `PERSIST_UPLOADS=false`
4. Generate a public domain for the application service.
5. Verify `/api/health`, registration, upload, analysis, history, and direct
   frontend routes.

Railway's trial provides a one-time $5 credit for up to 30 days. Its subsequent
free plan provides only $1 of monthly resource credit, which might not keep both
the app and PostgreSQL running continuously. With `PERSIST_UPLOADS=false`, each
temporary PDF is removed after text extraction; saved-resume reuse continues
from PostgreSQL.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install client and server dependencies |
| `npm run dev:client` | Start Vite dev server |
| `npm run dev:server` | Start API with nodemon |
| `cd client && npm run build` | Production frontend build |
| `cd server && npm start` | Run API in production |
| `npm run railway:build` | Install production dependencies and build for Railway |

## License

Private project — all rights reserved.
