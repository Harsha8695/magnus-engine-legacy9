# Migration Baseline — Magnus Unified Reporting Engine v1.1.0

## Purpose

This document records the canonical baseline state for v1.1.0. It is the
reference point for any future schema migrations or prompt-template upgrades.

## Database Schema (baseline)

```sql
CREATE TABLE IF NOT EXISTS reports (
  id           TEXT    PRIMARY KEY,
  client_id    TEXT    NOT NULL,
  prompt       TEXT    NOT NULL,
  response     TEXT,
  status       TEXT    NOT NULL DEFAULT 'pending',
  created_at   INTEGER NOT NULL,
  completed_at INTEGER
);
```

### Column Notes

| Column         | Type    | Notes                                           |
|----------------|---------|-------------------------------------------------|
| `id`           | TEXT    | UUID v4                                         |
| `client_id`    | TEXT    | Matches a key in `prompts/clients.js`           |
| `prompt`       | TEXT    | Full prompt string sent to Anthropic            |
| `response`     | TEXT    | Raw text returned by the model; NULL if pending |
| `status`       | TEXT    | `pending` → `completed` or `failed`             |
| `created_at`   | INTEGER | Unix timestamp in milliseconds                  |
| `completed_at` | INTEGER | Unix timestamp in milliseconds; NULL if pending |

## Client Prompts (baseline)

Three built-in client IDs are registered in `prompts/clients.js`:

| `client_id`   | Description                              |
|---------------|------------------------------------------|
| `default`     | Generic executive-summary report         |
| `finance`     | Board-level financial summary with KPIs  |
| `operations`  | SLA / incident performance report        |

Any `client_id` not listed above falls back to the `default` template.

## Environment Variables (baseline)

See `.env.example` for the complete list. The following are **required** at
runtime; the server will refuse to start without them:

- `ANTHROPIC_API_KEY`
- `SESSION_SECRET`

## Upgrade Path

When making breaking changes, create a new file `docs/MIGRATION_v1.2.0.md`
documenting schema diffs and any data-transformation steps required.
