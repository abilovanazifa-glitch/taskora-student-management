# Taskora — Final Production Checklist

Last updated: 2026-06-08

Use this checklist for university submission and production readiness. Items marked **Done** are implemented and verified. **Partial** needs manual confirmation or has known limits. **Not done** is out of scope or missing.

---

## Official requirements

| Requirement | Status | Notes |
| ----------- | ------ | ----- |
| Calendar (events + task deadlines) | **Done** | Month/week/day/list views; events CRUD; tasks on calendar |
| Subject, deadline, priority on tasks | **Done** | Task form, filters, table/card/kanban |
| Weekly & monthly calendar views | **Done** | View switcher in calendar hub |
| Deadline reminders | **Done** | Cron `/api/cron/reminders`, in-app notifications |
| Tags | **Done** | Tags panel, task tagging, filters |
| Dark mode | **Done** | Theme toggle, profile, `next-themes`, DB persistence |
| Japanese & Uzbek UI | **Done** | `next-intl`, locale switcher, `/ja` `/uz` |
| Automatic translation (explicit) | **Done** | DeepL server action + Translate button; manual fallback without API key |
| Multiple projects | **Done** | Projects list, CRUD, filters |
| Members & roles | **Done** | Per-project members panel, invitations, roles |

---

## Application areas reviewed

| Area | Status | Polish notes |
| ---- | ------ | ------------ |
| Landing page | **Done** | Responsive hero, feature cards, skip link, marketing header |
| Authentication | **Done** | Login/register, middleware gate, form errors |
| Dashboard | **Done** | Stats, lists, quick forms, Suspense skeleton |
| Projects | **Done** | List, detail, filters, bilingual forms |
| Members | **Done** | Invite, roles, leave/transfer (project detail) |
| Tasks | **Done** | Table/card/kanban, filters, pagination |
| Kanban | **Done** | Status columns; click-to-move (not drag library) |
| Calendar | **Done** | Multi-view hub, filters, event forms |
| Notifications | **Done** | List, read/delete, sidebar badge |
| Profile | **Done** | Name, avatar URL, language, theme |

---

## UX & quality

| Item | Status | Notes |
| ---- | ------ | ----- |
| Responsive design | **Done** | Mobile sidebar sheet, responsive grids, sm/lg breakpoints |
| Loading states | **Done** | Dashboard Suspense skeletons; `(app)/loading.tsx` |
| Empty states | **Done** | Shared `EmptyState` component across modules |
| Error states (forms) | **Done** | Translated field/form errors + toasts |
| Success states | **Done** | Toasts on create/update; inline success on quick forms |
| Page-level error UI | **Done** | `[locale]/error.tsx`, `global-error.tsx` |
| 404 page | **Done** | Root + localized `not-found.tsx` |
| Accessibility basics | **Partial** | Skip links, labels, `role="alert"`/`status`; full audit not run |
| SEO metadata | **Done** | Per-locale metadata, Open Graph, `robots.ts`, `sitemap.ts` |

---

## Testing & documentation

| Item | Status | Location |
| ---- | ------ | -------- |
| Vitest unit tests | **Done** | `tests/` (80+ tests) |
| Playwright e2e | **Done** | `e2e/` — landing, auth gate, 404 |
| Test specification | **Done** | `docs/TEST-SPECIFICATION.md` |
| Test result report | **Done** | `docs/TEST-RESULTS.md` |
| `.env.example` | **Done** | All documented vars incl. `CRON_SECRET` |
| GitHub deployment guide | **Done** | `docs/DEPLOYMENT-GITHUB.md` |
| Neon migration & seed guide | **Done** | `docs/DEPLOYMENT-NEON.md` |
| Vercel deployment guide | **Done** | `docs/DEPLOYMENT-VERCEL.md` |
| Demo accounts | **Done** | `npm run db:seed` — see README |
| Production checklist | **Done** | This file |

---

## Demo accounts (after seed)

| Email | Password | Purpose |
| ----- | -------- | ------- |
| `student@example.com` | `Student1!` | JA UI, owner, sample projects |
| `talaba@example.com` | `Talaba1!` | UZ UI, member |
| `sardor@example.com` | `Sardor1!` | Dark theme, pending invitation |

**Do not seed production** unless demo accounts are intentional.

---

## Production deployment checklist

- [ ] Set all env vars from `.env.example` on Vercel
- [ ] Generate strong `AUTH_SECRET` and `CRON_SECRET`
- [ ] Connect Neon pooled + direct URLs
- [ ] Run `npm run db:migrate:deploy` on production database
- [ ] Verify build: `npm run build`
- [ ] Verify cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_APP/api/cron/reminders`
- [ ] Smoke-test `/ja` and `/uz` on production URL
- [ ] Optional: set `TRANSLATION_API_KEY` for Translate button
- [ ] Confirm `NEXT_PUBLIC_APP_URL` and `AUTH_URL` match production domain

---

## Known limitations (not marked complete)

| Feature | Status | Reason |
| ------- | ------ | ------ |
| Email sending for invitations | **Not done** | Token links only; no SMTP |
| OAuth / social login | **Not done** | Credentials auth only |
| Password reset | **Not done** | Not implemented |
| Avatar file upload | **Not done** | URL field only |
| Global members page | **Not done** | Members per project only |
| Kanban drag-and-drop | **Not done** | Status change via UI controls |
| Full WCAG audit | **Not done** | Basic a11y only |
| CI GitHub Actions workflow | **Not done** | Documented; not committed |
| Component/unit tests for React UI | **Not done** | Logic covered by Vitest |

---

## Verification commands (last run)

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e    # requires dev server or Playwright webServer
npm run build
```

See `docs/TEST-RESULTS.md` for latest pass/fail counts and date.

---

## Sign-off

| Check | Pass |
| ----- | ---- |
| All official requirements implemented | Yes |
| Critical bugs blocking build/deploy | None known |
| Incomplete features labeled honestly | Yes |
| Documentation sufficient for deploy | Yes |
