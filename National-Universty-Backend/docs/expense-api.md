# Expense Management API Documentation

This document describes the expense management endpoints for the National University backend API.

## Base URL

All expense endpoints are prefixed with `/api/v1/expenses`

## Authentication

All endpoints require authentication via JWT token.

## Endpoints

### 1. Get All Expenses

**GET** `/api/v1/expenses`

**Access:** Admin, Auditor

**Description:** Retrieves a paginated list of all expenses with advanced filtering capabilities.

**Query Parameters:**

- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 10, max: 100)
- `search` (string, optional): Search in description, category, and vendor
- `category` (string, optional): Filter by expense category
- `vendor` (string, optional): Filter by vendor name
- `startDate` (string, optional): Filter from date (ISO 8601 format)
- `endDate` (string, optional): Filter to date (ISO 8601 format)
- `minAmount` (decimal, optional): Minimum expense amount
- `maxAmount` (decimal, optional): Maximum expense amount

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Expenses retrieved successfully",
    "expenses": [
      {
        "id": "cm123456789",
        "amount": "1500.00",
        "description": "Office supplies for administrative department",
        "category": "Office Supplies",
        "vendor": "ABC Office Store",
        "receiptUrl": "https://example.com/receipts/receipt123.pdf",
        "date": "2025-08-01T00:00:00.000Z",
        "createdBy": "cm987654321",
        "createdAt": "2025-08-01T10:30:00.000Z",
        "updatedAt": "2025-08-01T10:30:00.000Z",
        "creator": {
          "id": "cm987654321",
          "username": "admin_user",
          "email": "admin@university.edu"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalExpenses": 48,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 10
    }
  }
}
```

**Error Responses:**

- `401` - Unauthorized
- `403` - Forbidden (not admin/auditor)
- `500` - Internal server error

---

### 2. Get Single Expense

**GET** `/api/v1/expenses/:id`

**Access:** Admin, Auditor

**Description:** Retrieves a specific expense by its ID.

**URL Parameters:**

- `id` (string): The expense's unique identifier

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Expense retrieved successfully",
    "expense": {
      "id": "cm123456789",
      "amount": "1500.00",
      "description": "Office supplies for administrative department",
      "category": "Office Supplies",
      "vendor": "ABC Office Store",
      "receiptUrl": "https://example.com/receipts/receipt123.pdf",
      "date": "2025-08-01T00:00:00.000Z",
      "createdBy": "cm987654321",
      "createdAt": "2025-08-01T10:30:00.000Z",
      "updatedAt": "2025-08-01T10:30:00.000Z",
      "creator": {
        "id": "cm987654321",
        "username": "admin_user",
        "email": "admin@university.edu"
      }
    }
  }
}
```

**Error Responses:**

- `401` - Unauthorized
- `403` - Forbidden
- `404` - Expense not found
- `500` - Internal server error

---

### 3. Create New Expense

**POST** `/api/v1/expenses`

**Access:** Admin only

**Description:** Creates a new expense record in the system.

**Request Body:**

```json
{
  "amount": "1500.00",
  "description": "Office supplies for administrative department",
  "category": "Office Supplies",
  "vendor": "ABC Office Store",
  "receiptUrl": "https://example.com/receipts/receipt123.pdf",
  "date": "2025-08-01"
}
```

**Validation Rules:**

- **amount**: Required, decimal with up to 2 decimal places, > 0, < 999999999999.99
- **description**: Required, 3-1000 characters
- **category**: Required, 2-100 characters, letters, spaces, hyphens, underscores only
- **vendor**: Optional, 2-255 characters if provided
- **receiptUrl**: Optional, valid URL, max 500 characters
- **date**: Required, valid ISO 8601 date, not in future, not more than 10 years ago

**Success Response (201):**

```json
{
  "status": "success",
  "data": {
    "message": "Expense created successfully",
    "expense": {
      "id": "cm123456789",
      "amount": "1500.00",
      "description": "Office supplies for administrative department",
      "category": "Office Supplies",
      "vendor": "ABC Office Store",
      "receiptUrl": "https://example.com/receipts/receipt123.pdf",
      "date": "2025-08-01T00:00:00.000Z",
      "createdBy": "cm987654321",
      "createdAt": "2025-08-01T10:30:00.000Z",
      "updatedAt": "2025-08-01T10:30:00.000Z",
      "creator": {
        "id": "cm987654321",
        "username": "admin_user",
        "email": "admin@university.edu"
      }
    }
  }
}
```

**Error Responses:**

- `400` - Validation errors
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `500` - Internal server error

---

### 4. Update Expense

**PATCH** `/api/v1/expenses/:id`

**Access:** Admin only

**Description:** Updates expense information. Partial updates are supported.

**URL Parameters:**

- `id` (string): The expense's unique identifier

**Request Body (any combination):**

```json
{
  "amount": "1750.00",
  "description": "Updated office supplies description",
  "category": "Office Equipment",
  "vendor": "New Vendor Name",
  "receiptUrl": "https://example.com/receipts/updated-receipt.pdf",
  "date": "2025-08-02"
}
```

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Expense updated successfully",
    "expense": {
      "id": "cm123456789",
      "amount": "1750.00",
      "description": "Updated office supplies description",
      "category": "Office Equipment",
      "vendor": "New Vendor Name",
      "receiptUrl": "https://example.com/receipts/updated-receipt.pdf",
      "date": "2025-08-02T00:00:00.000Z",
      "createdBy": "cm987654321",
      "createdAt": "2025-08-01T10:30:00.000Z",
      "updatedAt": "2025-08-02T14:20:00.000Z",
      "creator": {
        "id": "cm987654321",
        "username": "admin_user",
        "email": "admin@university.edu"
      }
    }
  }
}
```

**Error Responses:**

- `400` - Validation errors
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - Expense not found
- `500` - Internal server error

---

### 5. Delete Expense

**DELETE** `/api/v1/expenses/:id`

**Access:** Admin only

**Description:** Deletes an expense from the system.

**URL Parameters:**

- `id` (string): The expense's unique identifier

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Expense deleted successfully"
  }
}
```

**Error Responses:**

- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - Expense not found
- `500` - Internal server error

---

### 6. Get Expenses by Category

**GET** `/api/v1/expenses/category/:category`

**Access:** Admin, Auditor

**Description:** Retrieves expenses filtered by category with pagination.

**URL Parameters:**

- `category` (string): The category to filter by

**Query Parameters:**

- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 10, max: 100)

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Expenses in category 'Office Supplies' retrieved successfully",
    "expenses": [
      {
        "id": "cm123456789",
        "amount": "1500.00",
        "description": "Office supplies for administrative department",
        "category": "Office Supplies",
        "vendor": "ABC Office Store",
        "receiptUrl": "https://example.com/receipts/receipt123.pdf",
        "date": "2025-08-01T00:00:00.000Z",
        "createdBy": "cm987654321",
        "createdAt": "2025-08-01T10:30:00.000Z",
        "updatedAt": "2025-08-01T10:30:00.000Z",
        "creator": {
          "id": "cm987654321",
          "username": "admin_user",
          "email": "admin@university.edu"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalExpenses": 15,
      "limit": 10
    }
  }
}
```

---

### 7. Get Expenses by Vendor

**GET** `/api/v1/expenses/vendor/:vendor`

**Access:** Admin, Auditor

**Description:** Retrieves expenses filtered by vendor with pagination.

**URL Parameters:**

- `vendor` (string): The vendor to filter by

**Query Parameters:**

- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 10, max: 100)

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Expenses from vendor 'ABC Office Store' retrieved successfully",
    "expenses": [
      {
        "id": "cm123456789",
        "amount": "1500.00",
        "description": "Office supplies for administrative department",
        "category": "Office Supplies",
        "vendor": "ABC Office Store",
        "receiptUrl": "https://example.com/receipts/receipt123.pdf",
        "date": "2025-08-01T00:00:00.000Z",
        "createdBy": "cm987654321",
        "createdAt": "2025-08-01T10:30:00.000Z",
        "updatedAt": "2025-08-01T10:30:00.000Z",
        "creator": {
          "id": "cm987654321",
          "username": "admin_user",
          "email": "admin@university.edu"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalExpenses": 8,
      "limit": 10
    }
  }
}
```

---

## Permission Matrix

| Operation          | Admin | Auditor | Other Users |
| ------------------ | ----- | ------- | ----------- |
| GET all expenses   | ✅    | ✅      | ❌          |
| GET single expense | ✅    | ✅      | ❌          |
| CREATE expense     | ✅    | ❌      | ❌          |
| UPDATE expense     | ✅    | ❌      | ❌          |
| DELETE expense     | ✅    | ❌      | ❌          |
| GET by category    | ✅    | ✅      | ❌          |
| GET by vendor      | ✅    | ✅      | ❌          |

---

## Error Codes

| Code  | Description                          |
| ----- | ------------------------------------ |
| `400` | Bad Request - Invalid input data     |
| `401` | Unauthorized - Invalid/missing token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Expense doesn't exist    |
| `500` | Internal Server Error                |

---

## Examples

### Get All Expenses with Filters

```bash
curl -X GET "http://localhost:3000/api/v1/expenses?search=office&category=supplies&minAmount=100&maxAmount=2000&startDate=2025-01-01&endDate=2025-12-31&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create New Expense

```bash
curl -X POST http://localhost:3000/api/v1/expenses \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "1500.00",
    "description": "Office supplies for administrative department",
    "category": "Office Supplies",
    "vendor": "ABC Office Store",
    "receiptUrl": "https://example.com/receipts/receipt123.pdf",
    "date": "2025-08-01"
  }'
```

### Update Expense

```bash
curl -X PATCH http://localhost:3000/api/v1/expenses/cm123456789 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "1750.00",
    "description": "Updated description"
  }'
```

### Get Expenses by Category

```bash
curl -X GET "http://localhost:3000/api/v1/expenses/category/Office%20Supplies?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete Expense

```bash
curl -X DELETE http://localhost:3000/api/v1/expenses/cm123456789 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Common Expense Categories

Suggested categories for consistent data entry:

- Office Supplies
- Equipment
- Utilities
- Maintenance
- Travel
- Training
- Software Licenses
- Telecommunications
- Rent
- Insurance
- Marketing
- Legal Services
- Consulting
- Miscellaneous

---

## Security Notes

1. **Authentication Required:** All endpoints require valid JWT token
2. **Role-Based Access:** Admins have full control, Auditors have read-only access
3. **Input Validation:** All inputs are validated and sanitized
4. **Amount Precision:** Decimal amounts support up to 2 decimal places
5. **Date Validation:** Dates cannot be in the future or more than 10 years old
6. **URL Validation:** Receipt URLs must be valid URLs if provided
