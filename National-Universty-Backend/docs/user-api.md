# User Management API Documentation

This document describes the user management endpoints for the National University backend API.

## Base URL

All user endpoints are prefixed with `/api/v1/users`

## Authentication

All endpoints require authentication via JWT token.

## Endpoints

### 1. Get All Users

**GET** `/api/v1/users`

**Access:** Admin only

**Description:** Retrieves a list of all users in the system.

**Query Parameters:**

- None

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Users retrieved successfully",
    "users": [
      {
        "id": "cm123456789",
        "username": "john_doe",
        "email": "john@university.edu",
        "role": "auditor",
        "lastLoginAt": "2025-08-03T10:00:00.000Z",
        "createdAt": "2025-08-03T09:30:00.000Z",
        "updatedAt": "2025-08-03T10:00:00.000Z"
      },
      {
        "id": "cm987654321",
        "username": "admin_user",
        "email": "admin@university.edu",
        "role": "admin",
        "lastLoginAt": "2025-08-03T11:00:00.000Z",
        "createdAt": "2025-08-02T09:00:00.000Z",
        "updatedAt": "2025-08-03T11:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (not admin)
- `500` - Internal server error

---

### 2. Get Single User

**GET** `/api/v1/users/:id`

**Access:** Admin only

**Description:** Retrieves a specific user by their ID.

**URL Parameters:**

- `id` (string): The user's unique identifier

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "User retrieved successfully",
    "user": {
      "id": "cm123456789",
      "username": "john_doe",
      "email": "john@university.edu",
      "role": "auditor",
      "lastLoginAt": "2025-08-03T10:00:00.000Z",
      "createdAt": "2025-08-03T09:30:00.000Z",
      "updatedAt": "2025-08-03T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - User not found
- `500` - Internal server error

---

### 3. Update User

**PATCH** `/api/v1/users/:id`

**Access:**

- Admin: Can update any user (including role changes)
- Self: Can update own profile (excluding role)

**Description:** Updates user information. Partial updates are supported.

**URL Parameters:**

- `id` (string): The user's unique identifier

**Request Body (any combination):**

```json
{
  "username": "new_username",
  "email": "newemail@university.edu",
  "password": "NewPassword123",
  "role": "accountant"
}
```

**Validation Rules:**

- **username**: 3-50 characters, alphanumeric and underscores only
- **email**: Valid email format, max 100 characters, unique
- **password**: 8-128 characters, must contain uppercase, lowercase, and number
- **role**: One of: `admin`, `auditor`, `accountant`, `finance_employee` (admin only)

**Permission Rules:**

- Users can update their own `username`, `email`, and `password`
- Only admins can update `role` fields
- Users cannot change their own role

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "User updated successfully",
    "user": {
      "id": "cm123456789",
      "username": "new_username",
      "email": "newemail@university.edu",
      "role": "accountant",
      "lastLoginAt": "2025-08-03T10:00:00.000Z",
      "createdAt": "2025-08-03T09:30:00.000Z",
      "updatedAt": "2025-08-03T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- `400` - Validation errors
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - User not found
- `409` - Conflict (email already exists)
- `500` - Internal server error

---

### 4. Delete User

**DELETE** `/api/v1/users/:id`

**Access:** Admin only

**Description:** Deletes a user from the system.

**URL Parameters:**

- `id` (string): The user's unique identifier

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "User deleted successfully"
  }
}
```

**Error Responses:**

- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - User not found
- `500` - Internal server error

---

## Permission Matrix

| Operation       | Admin | Self | Other Users |
| --------------- | ----- | ---- | ----------- |
| GET all users   | ✅    | ❌   | ❌          |
| GET single user | ✅    | ❌   | ❌          |
| UPDATE username | ✅    | ✅   | ❌          |
| UPDATE email    | ✅    | ✅   | ❌          |
| UPDATE password | ✅    | ✅   | ❌          |
| UPDATE role     | ✅    | ❌   | ❌          |
| DELETE user     | ✅    | ❌   | ❌          |

---

## Error Codes

| Code  | Description                          |
| ----- | ------------------------------------ |
| `400` | Bad Request - Invalid input data     |
| `401` | Unauthorized - Invalid/missing token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - User doesn't exist       |
| `409` | Conflict - Email already exists      |
| `500` | Internal Server Error                |

---

## Examples

### Get All Users (Admin)

```bash
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get Specific User

```bash
curl -X GET http://localhost:3000/api/v1/users/cm123456789 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Update User Profile (Self)

```bash
curl -X PATCH http://localhost:3000/api/v1/users/cm123456789 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "updated_username",
    "email": "updated@university.edu"
  }'
```

### Change User Role (Admin Only)

```bash
curl -X PATCH http://localhost:3000/api/v1/users/cm123456789 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "accountant"
  }'
```

### Delete User (Admin Only)

```bash
curl -X DELETE http://localhost:3000/api/v1/users/cm123456789 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Security Notes

1. **Authentication Required:** All endpoints require valid JWT token
2. **Role-Based Access:** Different operations require different permission levels
3. **Self-Service:** Users can update their own profiles (except role)
4. **Admin Privileges:** Admins have full control over user management
5. **Password Security:** Passwords are hashed using bcrypt before storage
6. **Email Uniqueness:** Email addresses must be unique across the system
