# Taskora

Taskora is a multilingual project, schedule, calendar, and task management web application for students. It supports Japanese and Uzbek interfaces and is designed for university submission and production deployment.

## Phase status

| Phase | Scope | Status |
| ----- | ----- | ------ |
| 1 | App shell, i18n, marketing landing | Done |
| 2 | PostgreSQL + Prisma schema & migrations | Done |
| 3 | Auth, CRUD, calendar, notifications, translation | Done |
| 4 | Production polish, tests, deployment docs | Done |

See **`FINAL-CHECKLIST.md`** for submission readiness and known limitations.

## Tech stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **PostgreSQL** + **Prisma ORM**
- **next-intl** (Japanese / Uzbek)
- **next-themes** (dark mode)
- **Auth.js** (credentials)
- **Zod**, **React Hook Form**, **date-fns**
- **Vitest** + **Playwright**

## Getting started

```bash
npm install
cp .env.example .env
# Set DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm run db:migrate
npm run db:seed    # optional demo accounts
npm run dev
```

Open [http://localhost:3000/ja](http://localhost:3000/ja) or [http://localhost:3000/uz](http://localhost:3000/uz).

### Demo accounts (after seed)

| Email | Password |
| ----- | -------- |
| `student@example.com` | `Student1!` |
| `talaba@example.com` | `Talaba1!` |
| `sardor@example.com` | `Sardor1!` |

### Local PostgreSQL example

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taskora?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/taskora?schema=public"
```

```sql
CREATE DATABASE taskora;
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client + production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run test:all` | typecheck + lint + unit + e2e |
| `npm run db:migrate` | Create/apply dev migration |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Demo users and sample data |
| `npm run db:studio` | Prisma Studio |

## Documentation

| Document | Purpose |
| -------- | ------- |
| [PRE-DEPLOYMENT-REPORT.md](./PRE-DEPLOYMENT-REPORT.md) | Latest production audit |
| [docs/deployment-guide.md](./docs/deployment-guide.md) | End-to-end deploy guide |
| [docs/neon-migration-guide.md](./docs/neon-migration-guide.md) | Neon Postgres migrations |
| [docs/vercel-environment-variables.md](./docs/vercel-environment-variables.md) | Env var names (no secrets) |
| [docs/production-verification-checklist.md](./docs/production-verification-checklist.md) | Post-deploy smoke tests |
| [FINAL-CHECKLIST.md](./FINAL-CHECKLIST.md) | Submission & production checklist |
| [docs/TEST-SPECIFICATION.md](./docs/TEST-SPECIFICATION.md) | Test plan |
| [docs/TEST-RESULTS.md](./docs/TEST-RESULTS.md) | Latest test run report |
| [docs/DEPLOYMENT-GITHUB.md](./docs/DEPLOYMENT-GITHUB.md) | GitHub setup |
| [docs/DEPLOYMENT-NEON.md](./docs/DEPLOYMENT-NEON.md) | Extended Neon notes |
| [docs/DEPLOYMENT-VERCEL.md](./docs/DEPLOYMENT-VERCEL.md) | Extended Vercel notes |

## Environment variables

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | Yes | PostgreSQL connection (pooled in production) |
| `DIRECT_URL` | Yes | Direct PostgreSQL URL for migrations |
| `AUTH_SECRET` | Yes | Auth.js secret |
| `AUTH_URL` | Yes | App URL for Auth.js |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (SEO, sitemap) |
| `CRON_SECRET` | Prod | Bearer token for reminder cron |
| `TRANSLATION_API_KEY` | No | DeepL key for JA ↔ UZ Translate button |
| `TRANSLATION_API_URL` | No | DeepL endpoint override |
| `TRANSLATION_RATE_LIMIT_PER_MINUTE` | No | Per-user limit (default `20`) |

## Bilingual content translation

User-created text is stored in **both Uzbek and Japanese**. Click **Translate** on bilingual fields to fill the other language (DeepL, server-side). Without `TRANSLATION_API_KEY`, enter both languages manually. Translation never runs silently on save.

## Git repository

Initialize and work from the **Taskora project folder** (`Nazifa/taskora`), not the parent `Cursor AI` workspace:

```bash
cd Nazifa/taskora
git rev-parse --show-toplevel   # should end with .../taskora
git status
```

Git is initialized in this folder. Add your GitHub remote when ready; do not commit `.env`.

## License

University project — private use.
