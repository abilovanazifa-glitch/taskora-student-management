# Neon PostgreSQL — migration & seed guide

Taskora uses **Prisma** with PostgreSQL. [Neon](https://neon.tech) provides serverless Postgres suitable for Vercel deployments.

## 1. Create a Neon project

1. Sign up at [neon.tech](https://neon.tech)
2. Create a project (e.g. `taskora-prod`)
3. Copy connection strings from the dashboard

Neon provides:

- **Pooled connection** — use for `DATABASE_URL` (app runtime, pgbouncer)
- **Direct connection** — use for `DIRECT_URL` (migrations)

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/taskora?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/taskora?sslmode=require"
```

## 2. Local development against Neon (optional)

```bash
cp .env.example .env
# paste Neon URLs into DATABASE_URL and DIRECT_URL
npm install
npm run db:migrate
npm run db:seed   # optional demo data
npm run dev
```

## 3. Apply migrations

### Development (creates new migrations)

```bash
npm run db:migrate
```

### Production / staging (apply existing migrations only)

```bash
npm run db:migrate:deploy
```

Run deploy against `DIRECT_URL`. On Vercel, run from your machine or CI:

```bash
DATABASE_URL="..." DIRECT_URL="..." npx prisma migrate deploy
```

## 4. Seed demo accounts (local / staging only)

```bash
npm run db:seed
```

| Email | Password | Notes |
| ----- | -------- | ----- |
| `student@example.com` | `Student1!` | Japanese UI, project owner |
| `talaba@example.com` | `Talaba1!` | Uzbek UI, team member |
| `sardor@example.com` | `Sardor1!` | Dark theme, sample invitation |

Seed also creates projects, tasks, calendar events, notifications, subjects, and tags.

## 5. Verify schema

```bash
npm run db:validate
npm run db:studio    # browse data locally
```

## 6. Reset local database (destructive)

```bash
npx prisma migrate reset
```

This drops data, reapplies migrations, and runs seed if configured in `package.json`.

## 7. Troubleshooting

| Issue | Fix |
| ----- | --- |
| Migration fails on pooler URL | Use `DIRECT_URL` for `migrate deploy` |
| `P1001` connection error | Check SSL (`sslmode=require`) and IP allowlist |
| Seed duplicate errors | Seed uses `upsert` — safe to re-run |
| Prisma client out of date | `npm run db:generate` |

## 8. Production checklist

- [ ] `DATABASE_URL` = pooled Neon URL in Vercel
- [ ] `DIRECT_URL` = direct Neon URL (for migrations only)
- [ ] Migrations deployed with `db:migrate:deploy`
- [ ] Seed **not** run on production unless demo accounts are intentional
- [ ] Backups enabled in Neon project settings
