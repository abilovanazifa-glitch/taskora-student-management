# Production verification checklist

Run after deploying to Vercel with Neon migrations applied.

## Infrastructure

- [ ] `npm run build` succeeds locally
- [ ] Vercel deployment status is Ready
- [ ] `npx prisma migrate status` shows all migrations applied
- [ ] `DATABASE_URL` uses Neon **pooled** URL
- [ ] `DIRECT_URL` uses Neon **direct** URL
- [ ] `AUTH_URL` and `NEXT_PUBLIC_APP_URL` match production domain
- [ ] `CRON_SECRET` is set in production

## Auth & security

- [ ] `/uz/register` creates a new account
- [ ] `/uz/login` logs in and redirects to dashboard
- [ ] Logout clears session
- [ ] `/uz/dashboard` redirects to login when logged out
- [ ] `/api/cron/reminders` returns `401` without Bearer token in production
- [ ] `/api/cron/reminders` returns `200` with correct Bearer token

## Locales

- [ ] `/uz/dashboard` loads Uzbek UI
- [ ] `/ja/dashboard` loads Japanese UI
- [ ] Language switcher updates preference
- [ ] `/en/dashboard` loads English UI (bonus locale)

## Core features

- [ ] **Calendar** — month and week views render events
- [ ] **Tasks** — create task with list (subject), deadline, priority, tags
- [ ] **Kanban** — drag task between columns
- [ ] **Notifications** — bell icon shows items
- [ ] **Profile** — edit name, theme, language
- [ ] **Translation** — Translate button fills other language (if `TRANSLATION_API_KEY` set)

## Themes

- [ ] Light theme renders correctly
- [ ] Dark theme renders correctly
- [ ] System theme follows OS preference

## Projects & collaboration

- [ ] Projects exist in database (workspace model)
- [ ] Invitations accept/decline flow works (`/invitations/[token]`)
- [ ] Project member roles enforced (owner/admin/member)
- [ ] Note: main nav hides Projects route; projects redirect to `/tasks`

## Mobile

- [ ] Sidebar collapses on mobile
- [ ] Kanban scrolls horizontally
- [ ] Task detail modal usable on 375px width
- [ ] Calendar readable on mobile

## Cron / reminders

- [ ] Manual cron curl returns `{ ok: true, ... }`
- [ ] Task with near deadline generates notification after cron run
- [ ] Event reminders fire for configured offsets

## Known limitations to verify awareness

- [ ] Avatar uploads use local filesystem — **may not persist on Vercel** (use external storage for production avatars)
- [ ] DeepL translation requires API key
- [ ] Playwright e2e requires `npx playwright install` in CI

## Automated checks (CI / local)

```bash
npm run typecheck   # expect pass
npm run lint        # expect 0 errors
npm test            # expect 84/84 pass
npm run build       # expect pass
npm run test:e2e    # requires Playwright browsers installed
```
