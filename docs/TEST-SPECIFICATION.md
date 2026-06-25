# Taskora — Test Specification

Last updated: 2026-06-08

## Scope

This document defines automated and manual verification for Taskora before production submission.

## Test layers

| Layer | Tool | Location | Purpose |
| ----- | ---- | -------- | ------- |
| Unit / logic | Vitest | `tests/**/*.test.ts` | Validations, permissions, calendar math, translation, reminders |
| End-to-end | Playwright | `e2e/**/*.spec.ts` | Public pages, auth gate, 404, responsive smoke |
| Manual | Checklist | `FINAL-CHECKLIST.md` | Full UX, seeded demo flows, production env |

## Vitest suites

| Suite | Files | Covers |
| ----- | ----- | ------ |
| Auth | `tests/auth/*` | Credentials validation, protected routes |
| Permissions | `tests/permissions/*` | Project/member access rules |
| Tasks | `tests/tasks/*` | Status transitions, overdue logic |
| Calendar | `tests/calendar/*` | Views, timezone, event validation |
| Translation | `tests/translation/*` | DeepL mapping, rate limit, direction |
| Notifications | `tests/notifications/*` | Reminder dedupe |
| Invitations | `tests/invitations/*` | Token expiry |
| i18n | `tests/i18n/*` | Locale helpers |
| Requirements | `tests/requirements/*` | Official feature flags |

### Commands

```bash
npm test                 # all Vitest suites
npm run test:auth        # auth only
npm run test:permissions # permissions only
npm run typecheck
npm run lint
```

## Playwright suites

| Spec | Covers |
| ---- | ------ |
| `e2e/landing.spec.ts` | JA/UZ landing hero, skip link |
| `e2e/auth.spec.ts` | Login/register forms, dashboard redirect |
| `e2e/not-found.spec.ts` | Localized 404 page |

### Prerequisites

- Node 20+
- Dependencies installed (`npm install`)
- Playwright browsers installed (`npx playwright install chromium`)
- Dev server reachable at `http://localhost:3000` (started automatically unless `PLAYWRIGHT_SKIP_WEBSERVER=1`)

### Commands

```bash
npm run test:e2e              # headless e2e
npm run test:e2e:ui           # Playwright UI mode
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e   # use existing dev server
```

## Official requirements mapping

| Requirement | Vitest | Playwright | Manual |
| ----------- | ------ | ---------- | ------ |
| Calendar (events + tasks) | `tests/calendar/*` | — | Calendar hub month/week/day/list |
| Subject, deadline, priority on tasks | `tests/validations/task.test.ts` | — | Task form + filters |
| Weekly & monthly views | `tests/calendar/views.test.ts`, `tests/requirements/*` | — | Calendar view switcher |
| Deadline reminders | `tests/notifications/dedupe.test.ts` | — | Cron + notifications page |
| Tags | — | — | Tasks page subjects/tags panel |
| Dark mode | — | — | Theme toggle + profile |
| Japanese & Uzbek UI | `tests/i18n/*`, `tests/requirements/*` | `e2e/landing.spec.ts` | Locale switcher |
| Automatic translation (explicit) | `tests/translation/*` | — | Bilingual field Translate button |
| Multiple projects | `tests/permissions/project.test.ts` | — | Projects list + detail |
| Members & invitations | `tests/permissions/members.test.ts`, `tests/invitations/*` | — | Project members panel |

## Demo account manual scenarios

After `npm run db:seed`:

| Account | Password | Scenario |
| ------- | -------- | -------- |
| `student@example.com` | `Student1!` | JA UI, project owner, dashboard |
| `talaba@example.com` | `Talaba1!` | UZ UI, member on shared projects |
| `sardor@example.com` | `Sardor1!` | Dark theme, pending invitation token in seed |

Manual checks: create task with subject/deadline/priority, switch kanban column, create calendar event, mark notification read, invite member, use Translate when API key set.

## Pass criteria

- `npm run typecheck` — 0 errors
- `npm run lint` — 0 errors
- `npm test` — all Vitest tests pass
- `npm run test:e2e` — all Playwright tests pass (with dev server)
- `npm run build` — production build succeeds
- `FINAL-CHECKLIST.md` — no blocking incomplete items for submission scope

## Out of scope (not tested automatically)

- Real email delivery for invitations
- OAuth / password reset
- File upload avatars (URL only)
- Load testing / security penetration testing
