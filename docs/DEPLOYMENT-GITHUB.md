# GitHub deployment guide

Use this guide to host Taskora source on GitHub and connect it to Vercel + Neon.

## 1. Create the repository

```bash
git init
git add .
git commit -m "Taskora: initial production-ready release"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/taskora.git
git push -u origin main
```

## 2. Recommended repository settings

- **Default branch:** `main`
- **Branch protection (optional):** require PR + passing CI before merge
- **Secrets:** do not commit `.env` — use platform environment variables instead

## 3. Files to keep in the repo

| Path | Purpose |
| ---- | ------- |
| `prisma/schema.prisma` | Database schema |
| `prisma/migrations/` | Versioned SQL migrations |
| `prisma/seed.ts` | Demo data (dev/staging only) |
| `.env.example` | Documented env var template |
| `vercel.json` | Cron schedule for reminders |
| `docs/` | Deployment and test documentation |
| `FINAL-CHECKLIST.md` | Submission readiness tracker |

## 4. GitHub Actions (optional CI)

Example workflow steps:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `npm run build` (with dummy `DATABASE_URL` for Prisma generate if needed)

Playwright e2e can run in CI with `PLAYWRIGHT_SKIP_WEBSERVER=0` and a test database, or be limited to manual pre-deploy runs.

## 5. Connect to Vercel

1. Import the GitHub repository in [Vercel](https://vercel.com)
2. Framework preset: **Next.js**
3. Build command: `npm run build` (default)
4. Install command: `npm install`
5. Add environment variables from `.env.example` (see `docs/DEPLOYMENT-VERCEL.md`)
6. Deploy

## 6. Post-deploy

- Run `npm run db:migrate:deploy` against production `DIRECT_URL` (Vercel CLI or Neon console)
- Set `CRON_SECRET` in Vercel and verify `/api/cron/reminders` returns 401 without auth
- Smoke-test `/ja` and `/uz` on the production URL

## 7. Demo data in production

**Do not run `db:seed` on production** unless you intentionally want demo accounts. Use seed only for local/staging environments.
