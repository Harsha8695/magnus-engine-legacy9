# Architecture — Magnus Unified Reporting Engine v1.1.0

## Overview

Magnus Engine is a lightweight Node.js service that accepts reporting requests,
generates natural-language reports via the Anthropic Claude API, and persists
results in a local SQLite database.

```
┌─────────────┐     HTTP      ┌──────────────────────┐     HTTPS     ┌──────────────┐
│  API Client │ ────────────► │  Express Server       │ ────────────► │  Anthropic   │
│  (Consumer) │ ◄──────────── │  (server.js / PM2 15) │ ◄──────────── │  Claude API  │
└─────────────┘               └──────────┬───────────┘               └──────────────┘
                                         │ read/write
                                         ▼
                               ┌──────────────────────┐
                               │  SQLite              │
                               │  data/reports.db     │
                               └──────────────────────┘
```

## Components

| Component              | Path                    | Role                                      |
|------------------------|-------------------------|-------------------------------------------|
| HTTP Server            | `server.js`             | Express app, route handlers, rate limiter |
| Prompt Builder         | `prompts/clients.js`    | Per-client prompt templates               |
| Database               | `data/reports.db`       | SQLite report store (runtime, gitignored) |
| Process Manager Config | `ecosystem.config.js`   | PM2 app definition (ID 15)                |
| Static Assets          | `public/`               | Served by Express static middleware       |

## Data Flow

1. Consumer calls `POST /api/reports` with `{ client_id, context }`.
2. Server persists a `pending` record in SQLite and returns `202 Accepted` with `{ id }`.
3. Asynchronously, the server builds the prompt via `prompts/clients.js`, calls
   the Anthropic Messages API, and updates the record to `completed` (or `failed`).
4. Consumer polls `GET /api/reports/:id` until `status` is `completed`.

## Security Boundaries

- All secrets (API key, session secret, DB path) are read from environment
  variables; never hard-coded or committed.
- `helmet` sets HTTP security headers.
- `express-rate-limit` caps API calls at 30 req/min per IP.
- SQLite is local-only — no network port is exposed for the database.
