# Payment API Endpoints

This document describes the payment management endpoints for the National University backend API.

## Base URL

All payment endpoints are prefixed with `/api/v1/payments`

## Authentication

All endpoints require authentication via JWT token. The token should be provided in the Authorization header or as a cookie.

## Authorization

- **Admin**: Full access to all payment operations
- **Auditor**: Read-only access to payment data

## Endpoints

### 1. Get All Payments

**GET** `/api/v1/payments`

**Access:** Admin, Auditor

**Query Parameters:**

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10, max: 100)
- `search` (optional): Search term for studentId, studentName, or receiptNumber
- `feeType` (optional): Filter by fee type (NEW_YEAR, SUPPLEMENTARY, LAB, STUDENT_SERVICES, OTHER)
- `paymentMethod` (optional): Filter by payment method (CASH, TRANSFER, CHEQUE)
- `startDate` (optional): Filter payments from this date (ISO8601 format)
- `endDate` (optional): Filter payments to this date (ISO8601 format)

**Example:**

```
GET /api/v1/payments?page=1&limit=20&feeType=NEW_YEAR&search=john
```

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "payments": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "studentId": "STU123456",
        "studentName": "أحمد محمد علي",
        "feeType": "NEW_YEAR",
        "amount": 2500.0,
        "receiptNumber": "RCP-2025-001234",
        "paymentMethod": "CASH",
        "paymentDate": "2025-08-16T10:30:00.000Z",
        "notes": "Payment for academic year 2025",
        "createdBy": {
          "id": "user-123",
          "username": "admin",
          "email": "admin@university.edu"
        },
        "createdAt": "2025-08-16T10:30:00.000Z",
        "updatedAt": "2025-08-16T10:30:00.000Z"
      },
      {
        "id": "456e7890-e89b-12d3-a456-426614174001",
        "studentId": "STU789012",
        "studentName": "فاطمة أحمد محمد",
        "feeType": "SUPPLEMENTARY",
        "amount": 1200.0,
        "receiptNumber": "RCP-2025-001235",
        "paymentMethod": "TRANSFER",
        "paymentDate": "2025-08-15T14:20:00.000Z",
        "notes": "Supplementary exam fees",
        "createdBy": {
          "id": "user-456",
          "username": "cashier01",
          "email": "cashier@university.edu"
        },
        "createdAt": "2025-08-15T14:20:00.000Z",
        "updatedAt": "2025-08-15T14:20:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 157,
      "totalPages": 16,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "cached": false
  }
}
```

**Cache Response (200):**

When data is served from cache (within 5 minutes), the response includes `"cached": true` in the data object:

```json
{
  "status": "success",
  "data": {
    "payments": [...],
    "pagination": {...},
    "cached": true
  }
}
```

**Performance:**

- **First Request**: ~200-500ms (database query)
- **Cached Request**: ~20-50ms (from Redis)
- **Cache Duration**: 5 minutes
- **Auto-refresh**: Cache refreshes on new requests after expiry

### 2. Get Payment by ID

**GET** `/api/v1/payments/:id`

**Access:** Admin, Auditor

**Parameters:**

- `id`: Payment UUID

**Example:**

```
GET /api/v1/payments/123e4567-e89b-12d3-a456-426614174000
```

### 3. Create Payment

**POST** `/api/v1/payments`

**Access:** Admin only

**Request Body:**

```json
{
  "studentId": "STU123456",
  "studentName": "John Doe",
  "feeType": "NEW_YEAR",
  "amount": "1500.00",
  "receiptNumber": "RCP-2024-001",
  "paymentMethod": "CASH",
  "paymentDate": "2024-08-02T10:00:00Z",
  "notes": "Payment for academic year 2024"
}
```

**Validation Rules:**

- `studentId`: Required, 1-50 characters
- `studentName`: Required, 2-100 characters, letters and spaces only
- `feeType`: Required, one of: NEW_YEAR, SUPPLEMENTARY, LAB, STUDENT_SERVICES, OTHER
- `amount`: Required, decimal with up to 2 decimal places, > 0
- `receiptNumber`: Required, unique, 1-100 characters, alphanumeric with hyphens/underscores
- `paymentMethod`: Required, one of: CASH, TRANSFER, CHEQUE
- `paymentDate`: Required, ISO8601 date, cannot be in the future
- `notes`: Optional, max 500 characters

### 4. Update Payment

**PATCH** `/api/v1/payments/:id`

**Access:** Admin only

**Parameters:**

- `id`: Payment UUID

**Request Body:** Same as create payment, but all fields are optional

### 5. Delete Payment

**DELETE** `/api/v1/payments/:id`

**Access:** Admin only

**Parameters:**

- `id`: Payment UUID

### 6. Get Payments by Student ID

**GET** `/api/v1/payments/student/:studentId`

**Access:** Admin, Auditor

**Parameters:**

- `studentId`: Student identifier

**Query Parameters:**

- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page

**Example:**

```
GET /api/v1/payments/student/STU123456?page=1&limit=10
```

### 7. Get Payment by Receipt Number

**GET** `/api/v1/payments/receipt/:receiptNumber`

**Access:** Admin, Auditor

**Parameters:**

- `receiptNumber`: Receipt number

**Example:**

```
GET /api/v1/payments/receipt/RCP-2024-001
```

## Response Format

All responses follow the JSend specification:

### Success Response

```json
{
  "status": "success",
  "data": {
    "payment": {
      /* payment object */
    },
    "pagination": {
      /* pagination info for list endpoints */
    }
  }
}
```

### Error Response

```json
{
  "status": "fail",
  "data": {
    "message": "Error description"
  }
}
```

## Payment Object Structure

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "studentId": "STU123456",
  "studentName": "John Doe",
  "feeType": "NEW_YEAR",
  "amount": 1500.0,
  "receiptNumber": "RCP-2024-001",
  "paymentMethod": "CASH",
  "paymentDate": "2024-08-02T10:00:00.000Z",
  "notes": "Payment for academic year 2024",
  "createdBy": {
    "id": "user-id",
    "username": "admin",
    "email": "admin@university.edu"
  },
  "createdAt": "2024-08-02T10:00:00.000Z",
  "updatedAt": "2024-08-02T10:00:00.000Z"
}
```

## Error Codes

- `400` - Bad Request (validation errors, duplicate receipt number)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (payment not found)
- `500` - Internal Server Error

## Fee Types

- `NEW_YEAR`: New academic year fees
- `SUPPLEMENTARY`: Supplementary exam fees
- `LAB`: Laboratory fees
- `STUDENT_SERVICES`: Student services fees
- `OTHER`: Other miscellaneous fees

## Payment Methods

- `CASH`: Cash payment
- `TRANSFER`: Bank transfer
- `CHEQUE`: Cheque payment
