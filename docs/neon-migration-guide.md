# Neon migration guide

Taskora uses Prisma with PostgreSQL. Neon is the recommended production database.

## 1. Create Neon project

1. Sign in at [neon.tech](https://neon.tech)
2. Create a project (e.g. `taskora-prod`)
3. Create a database (default is fine)
4. Copy both connection strings from the dashboard

## 2. Connection strings

| Variable | Neon type | Used for |
| -------- | --------- | -------- |
| `DATABASE_URL` | Pooled (PgBouncer) | App runtime on Vercel |
| `DIRECT_URL` | Direct | Prisma migrations |

Both URLs must include `?sslmode=require` for Neon.

## 3. Apply migrations

Existing migrations in `prisma/migrations/`:

| Migration | Purpose |
| --------- | ------- |
| `20260623150627_init` | Core schema (users, projects, tasks, etc.) |
| `20260608120000_calendar_reminders` | Calendar reminders |
| `20260608180000_add_preferred_language_en` | English locale support |
| `20260608200000_task_checklists_comments_attachments` | Task extras |

### From your machine (recommended first deploy)

```bash
cd path/to/taskora
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."
npm run db:migrate:deploy
```

On Windows PowerShell:

```powershell
$env:DATABASE_URL="postgresql://..."
$env:DIRECT_URL="postgresql://..."
npm run db:migrate:deploy
```

### Validate

```bash
npm run db:validate
npx prisma migrate status
```

## 4. Seed (staging / local only)

```bash
npm run db:seed
```

Seed is **idempotent for demo users** — it deletes and recreates seed-owned projects/tasks before inserting fresh demo data. Safe to rerun locally.

**Do not seed production** unless you explicitly want demo accounts exposed.

Demo credentials after seed:

| Email | Password |
| ----- | -------- |
| `student@example.com` | `Student1!` |
| `talaba@example.com` | `Talaba1!` |
| `sardor@example.com` | `Sardor1!` |

## 5. New users in production

Production users are created via `/register`. Empty workspaces receive default lists, labels, and sample tasks on first visit to `/tasks` (via `prepareUserTaskWorkspace`).

## 6. Troubleshooting

| Issue | Fix |
| ----- | --- |
| Migration timeout | Use `DIRECT_URL`, not pooled URL |
| SSL errors | Add `?sslmode=require` |
| Prisma client stale | Run `npm run db:generate` |
| Windows EPERM on generate | Stop `npm run dev` before `prisma generate` |

## 7. Reset (destructive, local only)

```bash
npx prisma migrate reset
```

Never run reset against production.
