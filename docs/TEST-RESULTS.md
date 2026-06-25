# Taskora — Test Result Report

**Date:** 2026-06-08  
**Environment:** Windows 10, Node.js, local dev server (Playwright webServer)

## Summary

| Suite | Result | Count |
| ----- | ------ | ----- |
| TypeScript (`npm run typecheck`) | **PASS** | 0 errors |
| ESLint (`npm run lint`) | **PASS** | 0 errors |
| Vitest (`npm test`) | **PASS** | 80 / 80 tests |
| Playwright (`npx playwright test --project=chromium`) | **PASS** | 7 / 7 tests |
| Production build (`npm run build`) | **PASS** | 23 static/dynamic routes |

**Overall:** All automated checks passed.

---

## Vitest breakdown (19 files)

| Area | Tests |
| ---- | ----- |
| Auth | credentials, routes, validations |
| Permissions | members, project |
| Tasks | status, overdue |
| Calendar | views, timezone, events |
| Translation | service, validation, rate-limit, direction |
| Notifications | dedupe |
| Invitations | token |
| i18n | locale |
| Validations | task |
| Requirements | official feature flags |

---

## Playwright breakdown (7 tests, chromium)

| Spec | Tests | Status |
| ---- | ----- | ------ |
| `e2e/landing.spec.ts` | JA hero, UZ hero, skip link | PASS |
| `e2e/auth.spec.ts` | Login form, register form, dashboard redirect | PASS |
| `e2e/not-found.spec.ts` | Localized 404 for unknown route | PASS |

Mobile Chrome project (`mobile-chrome`) is configured but not included in this report run. Run full matrix with:

```bash
npx playwright test
```

---

## Production build notes

- Prisma client generated during build
- Routes include `robots.txt`, `sitemap.xml`
- Locale static pages: `/ja`, `/uz`, `/ja/register`, `/uz/register`

---

## Manual testing recommended

Automated tests do **not** replace manual verification for:

- Logged-in flows with seeded demo accounts
- Kanban status changes
- Calendar drag/resize
- DeepL translation with API key
- Vercel cron with `CRON_SECRET` in production
- Cross-browser visual review

See `docs/TEST-SPECIFICATION.md` and `FINAL-CHECKLIST.md`.

---

## How to reproduce

```bash
npm run typecheck
npm run lint
npm test
npx playwright test --project=chromium
npm run build
```

Or combined:

```bash
npm run test:all
```

(Requires Playwright browsers installed: `npx playwright install chromium`)
