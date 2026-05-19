# RedOps Collab Development Plan

## MVP Target

This repo is being developed as a highly developed semester MVP, not a full production SRS implementation. The MVP should demonstrate the end-to-end workflow convincingly while leaving clearly marked seams for production hardening.

## Implemented First

1. TypeScript monorepo with `apps/web`, `apps/api`, and `packages/shared`.
2. Prototype UI migrated to React/Vite while preserving the visual language.
3. Fastify API with demo session auth and MFA challenge flow.
4. Seed-backed engagement, finding, target, task, report, team, activity, and audit data.
5. Writable finding creation and task movement flows through the API.
6. Docker Compose services for PostgreSQL, Redis, and MinIO.
7. Initial PostgreSQL schema draft with engagement-scoped tables and RLS enabled.

## Next Sprints

| Sprint | Scope | Outcome |
|---|---|---|
| 1 | PostgreSQL persistence | Replace seed arrays with repositories, migrations, and seed scripts |
| 2 | Real auth hardening | Argon2id passwords, TOTP secrets, session persistence, CSRF protection |
| 3 | Engagement management | Create/edit engagement, scope editor, team membership management |
| 4 | Findings module depth | CVSS vector calculator, comments, review transitions, duplicate warning |
| 5 | Evidence MVP | MinIO uploads, SHA-256 hashing, metadata, authorized download |
| 6 | Report export | Server-side HTML to PDF export and report status workflow |
| 7 | Realtime MVP | WebSocket task updates, presence, activity feed push |
| 8 | Hardening | RLS tests, audit log verification, Playwright flows, Docker production profile |

## Deferred From Semester MVP

| Feature | Reason |
|---|---|
| Full end-to-end encrypted messaging | High complexity, lower demo value than core pentest workflow |
| Full Yjs collaborative editor | Useful but can be represented after CRUD workflows are stable |
| Vault/KMS integration | Production security requirement, too large for first MVP pass |
| Kubernetes and air-gapped packaging | Release engineering scope after Docker Compose is mature |
| Native mobile apps | Explicitly post-v1 in the SRS |
