# Environment Variables Setup

This document describes the environment variables required for the National University Backend.

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

### Database Configuration

```env
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
```

### JWT Configuration

```env
JWT_SECRET="your-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"
```

### Redis Configuration

```env
REDIS_URL="redis://localhost:6379"
```

### Server Configuration

```env
PORT=3000
NODE_ENV="development"
```

### Frontend URL for QR Code Generation

```env
FRONTEND_URL="http://localhost:5173"
```

### CORS Origins (comma-separated)

```env
CORS_ORIGINS="http://localhost:3000,http://localhost:8080,http://localhost:8081,http://localhost:5173"
```

## Important Notes

1. **FRONTEND_URL**: This is used to generate QR codes that link to the receipt verification page. Make sure this points to your frontend application URL.

2. **CORS_ORIGINS**: Add your frontend URL to the CORS origins to allow cross-origin requests.

3. **Security**: Never commit your `.env` file to version control. Keep your JWT_SECRET secure and unique.

## Example .env file

```env
DATABASE_URL="mysql://root:password@localhost:3306/national_university"
JWT_SECRET="super-secret-jwt-key-2024"
JWT_EXPIRES_IN="7d"
REDIS_URL="redis://localhost:6379"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
CORS_ORIGINS="http://localhost:3000,http://localhost:8080,http://localhost:8081,http://localhost:5173"
```
