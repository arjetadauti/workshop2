# ADR 0001: Stack

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

The app replaces door-to-door cash collection for building common expenses (see `SPEC.md`). Residents open it as a simple link on their phone, and many of them are elderly. It handles money, so wrong data must be stopped before it is saved. The team is small, and the first version is built during a workshop.

## Decision

| Layer | Choice | Reason |
|---|---|---|
| UI | Next.js (React), mobile-first web pages | One link that works in any phone browser, with nothing to install. |
| API | Next.js server actions and routes, in TypeScript, in the same app | One codebase and one deploy for a small team. |
| Database | PostgreSQL, accessed with plain SQL through `pg` | Transactions and constraints (for example one payment per apartment per month) stop wrong money data at the database. |
| Hosting | Vercel, with managed Postgres in an EU region (Frankfurt) | A free tier for the demo, and personal data stays in the EU, which fits GDPR-style laws. |

## Consequences

- No ORM: the SQL in `db/migrations/` is the source of truth and is easy to review.
- Locally the app runs against Postgres 16 (Docker Compose or a local install).
- Invoice files are stored on local disk in version 1. Object storage is needed before deploying to Vercel.
