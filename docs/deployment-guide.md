# Taskora deployment guide

End-to-end guide for deploying Taskora to production using GitHub, Neon PostgreSQL, and Vercel.

## Overview

| Layer | Service | Purpose |
| ----- | ------- | ------- |
| Source | GitHub | Version control and Vercel CI trigger |
| Database | Neon | PostgreSQL (pooled + direct URLs) |
| Hosting | Vercel | Next.js 16 runtime, cron, env vars |
| Auth | Auth.js | Credentials provider, session cookies |
| Translation | DeepL (optional) | Server-side JA ↔ UZ content translation |

## Prerequisites

- Node.js 20+
- Git repository rooted at the Taskora project folder (`package.json` location)
- Neon account and project
- Vercel account linked to GitHub
- OpenSSL or similar tool to generate `AUTH_SECRET` and `CRON_SECRET`

## Deployment order

1. **GitHub** — push the Taskora repo (not the parent workspace folder).
2. **Neon** — create database, copy connection strings, run migrations.
3. **Vercel** — import repo, set environment variables, deploy.
4. **Post-deploy** — run `db:migrate:deploy`, verify cron, smoke-test `/uz` and `/ja`.

Detailed steps:

- [neon-migration-guide.md](./neon-migration-guide.md)
- [vercel-environment-variables.md](./vercel-environment-variables.md)
- [production-verification-checklist.md](./production-verification-checklist.md)

## Local production build check

Before deploying:

```bash
npm install
cp .env.example .env
# Fill DATABASE_URL, DIRECT_URL, AUTH_SECRET, AUTH_URL, NEXT_PUBLIC_APP_URL
npm run db:migrate:deploy
npm run typecheck
npm run lint
npm test
npm run build
```

Stop any running `npm run dev` process before `npm run build` on Windows (Prisma file lock).

## Build pipeline

| Step | Command | When |
| ---- | ------- | ---- |
| Install | `npm install` | Vercel build start |
| Prisma client | `prisma generate` | `postinstall` + `build` script |
| Next.js build | `next build` | `npm run build` |

## Cron reminders

`vercel.json` schedules `/api/cron/reminders` every 15 minutes. Production **must** set `CRON_SECRET`. The route rejects unauthenticated requests when `NODE_ENV=production` and the secret is configured.

## Locales

Public routes use locale prefixes: `/uz`, `/ja`, and `/en`. Default locale is Uzbek (`uz`).

## Security checklist

- Never commit `.env` (ignored by `.gitignore`)
- Keep `TRANSLATION_API_KEY` and `CRON_SECRET` server-side only
- Use Neon pooled URL for runtime, direct URL for migrations
- Do not run `db:seed` on production unless intentional (demo accounts)

## Related docs

- [DEPLOYMENT-GITHUB.md](./DEPLOYMENT-GITHUB.md) — repository setup
- [DEPLOYMENT-NEON.md](./DEPLOYMENT-NEON.md) — extended Neon notes
- [DEPLOYMENT-VERCEL.md](./DEPLOYMENT-VERCEL.md) — extended Vercel notes
- [../PRE-DEPLOYMENT-REPORT.md](../PRE-DEPLOYMENT-REPORT.md) — latest audit status
