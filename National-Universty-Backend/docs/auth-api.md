# Authentication API Documentation

This document describes the authentication endpoints for the National University backend API.

## Base URL

All authentication endpoints are prefixed with `/api/v1/auth`

## Endpoints

### 1. Register New User

**POST** `/api/v1/auth/register`

**Access:** Public (no authentication required)

**Description:** Creates a new user account in the system.

**Request Body:**

```json
{
  "username": "john_doe",
  "email": "john@university.edu",
  "password": "SecurePass123",
  "role": "auditor"
}
```

**Validation Rules:**

- **username**: Required, 3-50 characters, alphanumeric and underscores only
- **email**: Required, valid email format, max 100 characters, unique
- **password**: Required, 8-128 characters, must contain uppercase, lowercase, and number
- **role**: Required, one of: `admin`, `auditor`, `accountant`, `finance_employee`

**Success Response (201):**

```json
{
  "status": "success",
  "data": {
    "message": "User registered successfully",
    "user": {
      "id": "cm123456789",
      "username": "john_doe",
      "email": "john@university.edu",
      "role": "auditor",
      "createdAt": "2025-08-03T10:00:00.000Z",
      "updatedAt": "2025-08-03T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- `400` - Validation errors (invalid input)
- `409` - Conflict (username or email already exists)
- `500` - Internal server error

---

### 2. User Login

**POST** `/api/v1/auth/login`

**Access:** Public (no authentication required)

**Description:** Authenticates a user and returns a JWT token.

**Request Body:**

```json
{
  "email": "john@university.edu",
  "password": "SecurePass123"
}
```

**Validation Rules:**

- **email**: Required, valid email format
- **password**: Required, minimum 1 character

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Login successful",
    "user": {
      "id": "cm123456789",
      "username": "john_doe",
      "email": "john@university.edu",
      "role": "auditor",
      "lastLoginAt": "2025-08-03T10:00:00.000Z",
      "createdAt": "2025-08-03T09:30:00.000Z",
      "updatedAt": "2025-08-03T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- `400` - Validation errors
- `401` - Invalid credentials
- `500` - Internal server error

---

## Authentication Flow

### 1. Token Usage

After successful login, include the token in requests:

**Header Method:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Cookie Method (automatic):**
The token is also set as an HTTP-only cookie named `token`.

### 2. Token Expiration

- **Validity:** 7 days (configurable via `JWT_EXPIRES_IN`)
- **Renewal:** Login again to get a new token
- **Security:** Tokens are signed with `JWT_SECRET_KEY`

---

## User Roles

| Role               | Description          | Permissions                            |
| ------------------ | -------------------- | -------------------------------------- |
| `admin`            | System Administrator | Full access to all resources           |
| `auditor`          | Financial Auditor    | Read-only access to payments and users |
| `accountant`       | Accountant           | (Future implementation)                |
| `finance_employee` | Finance Employee     | (Future implementation)                |

---

## Error Codes

| Code  | Description                                 |
| ----- | ------------------------------------------- |
| `400` | Bad Request - Invalid input data            |
| `401` | Unauthorized - Invalid credentials          |
| `409` | Conflict - Username or email already exists |
| `500` | Internal Server Error                       |

---

## Examples

### Register Admin User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@university.edu",
    "password": "AdminPass123",
    "role": "admin"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "password": "AdminPass123"
  }'
```

### Using Token in Subsequent Requests

```bash
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```
