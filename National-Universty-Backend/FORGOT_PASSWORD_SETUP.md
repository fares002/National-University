# Forgot Password Functionality Setup

This document describes the setup required for the forgot password functionality with email support.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# JWT Secret for password reset tokens
JWT_SECRET=your-secure-jwt-secret-here

# Frontend URL for password reset links
FRONTEND_URL=http://localhost:5173

# Redis configuration (if not already configured)
REDIS_URL=redis://localhost:6379

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Features Implemented

### Backend

1. **Forgot Password Endpoint** (`POST /api/v1/auth/forgot-password`)

   - Accepts email address
   - Generates JWT token with 15-minute expiration
   - Stores token in Redis for validation
   - **Sends professional HTML email** with reset link
   - Returns success message (doesn't reveal if email exists)

2. **Reset Password Endpoint** (`POST /api/v1/auth/reset-password`)

   - Accepts token, new password, and confirm password
   - Validates JWT token and Redis storage
   - Updates user password in database
   - Removes token from Redis after successful reset

3. **Verify Token Endpoint** (`GET /api/v1/auth/verify-reset-token/:token`)
   - Validates reset token before showing reset form
   - Returns token validity and associated email

### Frontend

1. **Forgot Password Page** (`/forgot-password`)

   - Email input form
   - Success message after email sent
   - Helpful instructions about checking inbox and spam folder
   - Navigation back to login

2. **Reset Password Page** (`/reset-password?token=...`)
   - New password and confirm password inputs
   - Password strength validation
   - Token validation on page load
   - Success message after password reset

## Email Features

- **Professional HTML template** with Arabic RTL support
- **University branding** and styling
- **Direct reset button** that links to reset page
- **Fallback URL** in case button doesn't work
- **Security warnings** about link expiration
- **Responsive design** for all devices

## Security Features

- **Stateless JWT tokens** with 15-minute expiration
- **Redis storage** for additional token validation
- **No email existence disclosure** for security
- **Password strength requirements** (8+ chars, uppercase, lowercase, number)
- **Token invalidation** after successful password reset
- **Secure email transmission** using SMTP with authentication

## Usage Flow

1. User clicks "Forgot Password" on login page
2. User enters email address on forgot password page
3. Backend generates reset token and stores in Redis
4. **Professional email is sent** with reset link
5. User receives email and clicks reset link
6. User enters new password on reset page
7. Backend validates token and updates password
8. User is redirected to login with success message

## Email Setup

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

### Testing Email Configuration

Run the test script to verify email setup:

```bash
node test-email.js
```

## Development Notes

- **Development mode**: Reset URLs are logged to console and included in response
- **Production mode**: Reset URLs are only sent via email
- Redis is required for token storage and validation
- JWT tokens expire after 15 minutes for security
- Professional email templates are automatically generated

## Testing

Test the functionality by:

1. Going to `/forgot-password`
2. Entering a valid email address
3. **Checking email inbox** for password reset email
4. **Clicking the reset button** in the email
5. Entering a new password
6. Verifying successful password reset

## Troubleshooting

### Common Issues

1. **Email not sending**:

   - Check email configuration in `.env`
   - Verify app password for Gmail
   - Run `node test-email.js` to test configuration

2. **Redis connection errors**:

   - Ensure Redis is running
   - Check `REDIS_URL` configuration

3. **JWT errors**:
   - Verify `JWT_SECRET` is set
   - Check token expiration settings
