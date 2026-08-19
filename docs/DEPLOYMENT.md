# Deployment Guide — Magnus Unified Reporting Engine v1.1.0

## Prerequisites

- Node.js ≥ 18
- PM2 installed globally (`npm install -g pm2`)
- Anthropic API key

## 1. Clone and Install

```bash
git clone <repo-url> magnus-engine
cd magnus-engine
npm install
```

## 2. Configure Environment

Copy the example file and fill in real values:

```bash
cp .env.example .env
$EDITOR .env
```

**Never commit `.env` to version control.**

| Variable          | Description                                     |
|-------------------|-------------------------------------------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key                        |
| `SESSION_SECRET`  | Random secret for session signing (≥ 32 chars)  |
| `PORT`            | HTTP port (default `3000`)                      |
| `DB_PATH`         | Path to SQLite file (default `data/reports.db`) |
| `ANTHROPIC_MODEL` | Model ID (default `claude-3-5-sonnet-20241022`) |

## 3. Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # configure auto-restart on reboot
```

PM2 app ID is **15** (`pm2 describe 15`).

## 4. Verify

```bash
curl http://localhost:3000/health
# {"status":"ok","version":"1.1.0","ts":...}
```

Or run the smoke test:

```bash
bash tests/smoke-test.sh
```

## 5. Log Management

Logs are written to `logs/` (gitignored). Rotate with:

```bash
pm2 install pm2-logrotate
```

## 6. Stopping / Restarting

```bash
pm2 restart magnus-engine
pm2 stop    magnus-engine
pm2 delete  magnus-engine
```

## 7. Database Backups

The SQLite database at `data/reports.db` is gitignored. Back it up externally:

```bash
sqlite3 data/reports.db ".backup '/path/to/backup/reports-$(date +%F).db'"
```

Store backups outside the repository directory.
