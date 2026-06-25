# Vercel deployment guide

Deploy Taskora (Next.js 16) to [Vercel](https://vercel.com) with Neon PostgreSQL and scheduled reminder cron.

## 1. Import project

1. Connect your GitHub repository to Vercel
2. Framework: **Next.js** (auto-detected)
3. Root directory: repository root (where `package.json` lives)

## 2. Environment variables

Set these in **Project → Settings → Environment Variables** for Production (and Preview if needed):

| Variable | Required | Example / notes |
| -------- | -------- | --------------- |
| `DATABASE_URL` | Yes | Neon **pooled** URL |
| `DIRECT_URL` | Yes | Neon **direct** URL (migrations) |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `AUTH_URL` | Yes | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Yes | Same as public app URL |
| `CRON_SECRET` | Yes (prod) | Random secret; Vercel cron sends `Authorization: Bearer …` |
| `TRANSLATION_API_KEY` | No | DeepL key for Translate button |
| `TRANSLATION_API_URL` | No | DeepL endpoint override |
| `TRANSLATION_RATE_LIMIT_PER_MINUTE` | No | Default `20` |

Copy the template from `.env.example`.

## 3. Build settings

| Setting | Value |
| ------- | ----- |
| Build Command | `npm run build` |
| Output | Next.js default |
| Install Command | `npm install` |
| Node.js Version | 20.x |

`postinstall` runs `prisma generate` automatically.

## 4. Database migrations

After first deploy, apply migrations to production:

```bash
DATABASE_URL="..." DIRECT_URL="..." npm run db:migrate:deploy
```

Use the **direct** Neon connection for `DIRECT_URL`.

## 5. Cron jobs (deadline reminders)

`vercel.json` configures:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Requirements:

1. Set `CRON_SECRET` in Vercel env
2. Vercel Cron (Pro plan feature on hobby may vary) invokes the route on schedule
3. Endpoint: `GET /api/cron/reminders` with header `Authorization: Bearer <CRON_SECRET>`

Manual test (replace values):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/reminders
```

In local dev without `CRON_SECRET`, the route allows unauthenticated access when `NODE_ENV !== production`.

## 6. Domains & locales

- App uses locale prefix: `/ja`, `/uz`
- Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your canonical domain
- Optional: redirect apex domain to `/ja` via Vercel redirects

## 7. Post-deploy smoke test

1. Open `/ja` — landing page loads
2. Register or log in with demo account (staging only)
3. Dashboard, projects, tasks, calendar, notifications load
4. Toggle dark mode
5. Switch locale JA ↔ UZ
6. Verify cron endpoint returns `{ ok: true }` with valid secret

## 8. Preview deployments

- Use a separate Neon **branch** or staging database for preview env vars
- Do not share production `CRON_SECRET` with preview unless intentional

## 9. Known limitations

- **Email invitations:** tokens work via link; no SMTP integration
- **Translation:** optional; requires DeepL API key
- **File uploads:** avatar is URL-only

See `FINAL-CHECKLIST.md` for full feature status.
