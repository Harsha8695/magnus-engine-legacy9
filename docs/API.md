# API Reference — Magnus Unified Reporting Engine v1.1.0

Base URL: `http://localhost:3000`

## Health

### `GET /health`

Returns server status.

**Response 200**
```json
{
  "status": "ok",
  "version": "1.1.0",
  "ts": 1700000000000
}
```

---

## Reports

### `POST /api/reports`

Queue a new report for generation.

**Request body**
```json
{
  "client_id": "finance",
  "context": {
    "period": "Q4-2024",
    "revenue": 1200000,
    "costs": 850000
  }
}
```

| Field       | Type   | Required | Description                              |
|-------------|--------|----------|------------------------------------------|
| `client_id` | string | Yes      | Identifies which prompt template to use  |
| `context`   | object | No       | Arbitrary data injected into the prompt  |

**Response 202**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending"
}
```

---

### `GET /api/reports`

List reports for a client.

**Query parameters**

| Param       | Type    | Required | Default | Description              |
|-------------|---------|----------|---------|--------------------------|
| `client_id` | string  | Yes      | —       | Filter by client         |
| `limit`     | integer | No       | 20      | Max rows to return       |
| `offset`    | integer | No       | 0       | Pagination offset        |

**Response 200**
```json
{
  "reports": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "client_id": "finance",
      "status": "completed",
      "created_at": 1700000000000,
      "completed_at": 1700000012345
    }
  ]
}
```

---

### `GET /api/reports/:id`

Fetch a single report including the generated response.

**Response 200**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "client_id": "finance",
  "prompt": "You are a senior financial analyst...",
  "response": "## Executive Summary\n...",
  "status": "completed",
  "created_at": 1700000000000,
  "completed_at": 1700000012345
}
```

**Response 404**
```json
{ "error": "Report not found" }
```

---

## Error Codes

| HTTP Status | Meaning                          |
|-------------|----------------------------------|
| 400         | Missing or invalid request body  |
| 404         | Resource not found               |
| 429         | Rate limit exceeded (30 req/min) |
| 500         | Internal server error            |
