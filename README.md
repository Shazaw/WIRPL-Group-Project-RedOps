# RedOps Collab

Highly developed semester MVP for a penetration testing and security audit collaboration platform. The repo now contains the original SRS/prototype plus a runnable TypeScript monorepo foundation.

## Apps

| Path | Purpose |
|---|---|
| `apps/web` | React + Vite frontend preserving the original red terminal-style prototype UI |
| `apps/api` | Fastify TypeScript API with session auth, MFA demo flow, audit events, and seed-backed MVP endpoints |
| `packages/shared` | Shared TypeScript contracts used by frontend and backend |
| `infra/migrations` | PostgreSQL schema draft for the next persistence phase |

## Quick Start

```bash
npm install
npm run dev
```

Or run the apps separately:

```bash
npm run dev:api
```

In another terminal:

```bash
npm run dev:web
```

Open `http://localhost:5173`.

Demo login:

```text
email: r.chen@redops.io
passphrase: any value
MFA code: any value
```

## Development Services

Start local infrastructure for the upcoming PostgreSQL/Redis/MinIO persistence phase:

```bash
docker compose up -d postgres redis minio
```

## Useful Scripts

| Command | Purpose |
|---|---|
| `npm run dev:api` | Build shared contracts, then run the Fastify API on port `4000` |
| `npm run dev:web` | Build shared contracts, then run the Vite app on port `5173` |
| `npm run typecheck` | Typecheck shared, API, and web workspaces |
| `npm run build` | Production build for all workspaces |

## Current MVP Coverage

Implemented in this first development pass:

| Area | Status |
|---|---|
| Monorepo scaffold | Done |
| React/Vite UI migration | Done |
| TypeScript backend | Done |
| Demo login + MFA | Done |
| Dashboard API | Done |
| Engagement workspace API | Done |
| Finding creation | Done |
| Task creation and movement | Done |
| Audit log chain | Seed-backed implementation done |
| PostgreSQL schema | Draft migration added |

Next major step: replace the in-memory API store with PostgreSQL repositories using the schema in `infra/migrations/0001_initial.sql`.
