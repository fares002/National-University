# Analytics API Documentation

This document describes the analytics endpoints for the National University backend API.

## Base URL

All analytics endpoints are prefixed with `/api/v1/analytics`

## Endpoints

### 1. Get Charts Analytics

**GET** `/api/v1/analytics/charts?year=2025`

**Access:** Protected (requires authentication token)

**Description:**
Retrieves analytics data for dashboard charts, filtered by year if provided.

**Query Parameters:**

- `year` (optional): The year for which to retrieve analytics data (e.g., `2025`).

**Headers:**

- `Authorization: Bearer <token>`

**Success Response (200):**

```json
{
  "paymentsByMonth": [
    { "month": "January", "total": 12345 },
    { "month": "February", "total": 6789 }
    // ...
  ],
  "expensesByMonth": [
    { "month": "January", "total": 2345 },
    { "month": "February", "total": 1789 }
    // ...
  ],
  "topExpenseCategories": [
    { "category": "Salaries", "total": 5000 },
    { "category": "Bonuses", "total": 2000 }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: If the token is missing or invalid.
- `500 Internal Server Error`: On server error.

---

> For all requests, ensure you include a valid JWT token in the `Authorization` header.
