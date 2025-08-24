# Email Setup for Password Reset Functionality

This document describes how to configure email functionality for password reset using Nodemailer.

## Required Environment Variables

Add the following environment variables to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Email Service Configuration

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

### Other Email Services

You can use other email services by changing `EMAIL_SERVICE`:

- **Outlook/Hotmail**: `EMAIL_SERVICE=outlook`
- **Yahoo**: `EMAIL_SERVICE=yahoo`
- **Custom SMTP**: Use the following configuration instead:

```env
# Custom SMTP Configuration
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
EMAIL_SECURE=false
```

## Testing Email Configuration

You can test your email configuration by running:

```typescript
import { testEmailConnection } from "./src/utils/emailService";

// Test email connection
testEmailConnection().then((isValid) => {
  if (isValid) {
    console.log("Email service is working correctly");
  } else {
    console.log("Email service configuration error");
  }
});
```

## Email Template Features

The password reset email includes:

- **Professional HTML template** with Arabic RTL support
- **University branding** and styling
- **Reset button** that links directly to the reset page
- **Fallback URL** in case the button doesn't work
- **Security warnings** about link expiration
- **Responsive design** for mobile and desktop

## Security Features

- **JWT tokens** expire after 15 minutes
- **Redis storage** for additional token validation
- **No email existence disclosure** for security
- **Secure email transmission** using SMTP with authentication

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**:

   - Check that `EMAIL_USER` and `EMAIL_PASSWORD` are correct
   - For Gmail, ensure you're using an app password, not your regular password

2. **"Connection timeout" error**:

   - Check your internet connection
   - Verify the email service is accessible from your network

3. **"Authentication failed" error**:

   - Ensure 2FA is enabled on your Gmail account
   - Generate a new app password

4. **Redis connection errors**:
   - Make sure Redis is running on your system
   - Check `REDIS_URL` configuration

### Development vs Production

- **Development**: Reset URLs are logged to console and included in response
- **Production**: Reset URLs are only sent via email, not logged or returned

## Production Considerations

1. **Use environment-specific email templates**
2. **Implement email queue system** for high-volume applications
3. **Add email delivery tracking**
4. **Set up email bounce handling**
5. **Use dedicated email service** (SendGrid, Mailgun, etc.) for production

## Example Usage

```typescript
// The forgotPassword function automatically:
// 1. Generates JWT token
// 2. Stores token in Redis
// 3. Sends email with reset link
// 4. Returns success response

// Users receive an email with:
// - Professional HTML template
// - Direct reset button
// - Fallback URL
// - Security information
```

## Testing the Complete Flow

1. **Start your backend server**
2. **Ensure Redis is running**
3. **Configure email environment variables**
4. **Test forgot password endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```
5. **Check email inbox** for password reset email
6. **Click reset link** to test the complete flow
