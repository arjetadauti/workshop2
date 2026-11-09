# CLAUDE.md

Building common-expenses tracker. The product spec is `SPEC.md`, and the stack decision is `docs/adr/0001-stack.md`.

## Run it

```bash
cp .env.example .env              # set DATABASE_URL
docker compose up -d db           # or use a local Postgres 16
npm install
npm run db:migrate
npm run db:seed                   # demo manager + building
npm run dev                       # http://localhost:3000
npm test                          # Vitest, needs TEST_DATABASE_URL
```

In development, SMS are not sent. They are printed to the terminal running `npm run dev`, including login codes.

## Layout

- `app/`: Next.js App Router pages and server actions
- `lib/`: database access (`db.ts`), auth, SMS, money and month helpers, i18n texts
- `db/migrations/`: plain SQL migrations, run in file-name order
- `scripts/`: migrate and seed
- `tests/`: Vitest tests, one file per Must feature

## Rules

- **Money is integer cents** (`bigint` / `amount_cents`). Never use floats for money.
- **Nothing is deleted.** Payments and expenses are never updated or deleted. A correction is a new row that points to the original (`reverses_id`).
- **Residents only see their own apartment.** Every resident query is filtered by the `apartment_id` from the session, never by an id from the URL or form.
- **Building data** (balance, expenses, invoices) is only shown to users of that building.
- Business rules that protect money (unique month per apartment, unique receipt number) live in the database as constraints, not only in code.
- UI texts live in `lib/i18n.ts`. Albanian is the default.
- One commit per feature. `npm run build` and `npm test` pass before each commit.
