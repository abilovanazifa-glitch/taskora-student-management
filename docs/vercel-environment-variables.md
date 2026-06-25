# Vercel environment variables

Set these in **Vercel → Project → Settings → Environment Variables**.  
Names and purposes only — **never commit secret values**.

## Required (Production)

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | PostgreSQL pooled connection for Prisma at runtime (Neon pooler URL) |
| `DIRECT_URL` | Direct PostgreSQL connection for Prisma migrations |
| `AUTH_SECRET` | Auth.js session signing secret (random 32+ bytes) |
| `AUTH_URL` | Canonical app URL for Auth.js callbacks (e.g. `https://your-app.vercel.app`) |
| `NEXT_PUBLIC_APP_URL` | Public site URL for sitemap, metadata, and absolute links |
| `CRON_SECRET` | Bearer token Vercel Cron sends to `/api/cron/reminders` |

## Optional

| Variable | Purpose |
| -------- | ------- |
| `TRANSLATION_API_KEY` | DeepL API key for the Translate button on bilingual fields |
| `TRANSLATION_API_URL` | DeepL endpoint override (defaults to free-tier API URL) |
| `TRANSLATION_RATE_LIMIT_PER_MINUTE` | Per-user translation rate limit (default: `20`) |
| `PLAYWRIGHT_BASE_URL` | Base URL for Playwright tests (CI only) |
| `PLAYWRIGHT_SKIP_WEBSERVER` | Skip dev server auto-start in Playwright (CI only) |

## Environment scope

| Variable | Production | Preview | Development |
| -------- | ---------- | ------- | ------------- |
| `DATABASE_URL` | Neon prod pool | Neon branch / staging | Local or Neon dev |
| `DIRECT_URL` | Neon prod direct | Same branch direct | Local or Neon dev |
| `AUTH_SECRET` | Unique prod secret | Unique preview secret | Local secret |
| `AUTH_URL` | Production domain | Preview URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Production domain | Preview URL | `http://localhost:3000` |
| `CRON_SECRET` | Required | Recommended | Optional locally |
| `TRANSLATION_API_KEY` | Optional | Optional | Optional |

## Auth.js notes

- `AUTH_URL` must match the deployed domain exactly (including `https://`).
- After changing domain, update both `AUTH_URL` and `NEXT_PUBLIC_APP_URL`.
- Generate `AUTH_SECRET` with: `openssl rand -base64 32`

## Cron notes

- Vercel sends: `Authorization: Bearer <CRON_SECRET>`
- Route: `GET /api/cron/reminders`
- Schedule: every 15 minutes (`vercel.json`)
- Without `CRON_SECRET` in production, cron requests return `401`

## Translation notes

- `TRANSLATION_API_KEY` stays server-side (used in Server Actions only).
- Without a key, users can still enter Uzbek and Japanese manually.
- Translation is **on-demand** (Translate button), not automatic on save.

## Local template

Copy from `.env.example`:

```bash
cp .env.example .env
```

Fill values locally; `.env` is gitignored.
