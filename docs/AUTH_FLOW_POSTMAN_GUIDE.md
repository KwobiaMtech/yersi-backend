# Yersi Authentication Flow - Postman Guide

## Overview
This guide explains how to use the Postman collection to test the complete authentication flow for the Yersi Laundry Service API.

## Setup Instructions

### 1. Import Collection and Environment
1. Import `Yersi-Auth-Complete.postman_collection.json` into Postman
2. Import `Yersi-Auth.postman_environment.json` as environment
3. Select the "Yersi Authentication Environment" in Postman

### 2. Start the Server
```bash
cd yersi-backend
npm run start:dev
```

## Authentication Flow Testing

### Step 1: Register User
- **Endpoint**: `POST /api/v1/auth/register`
- **Request**: Uses variables `{{test_email}}` and `{{test_password}}`
- **Expected Response**: Registration success message
- **Note**: Check server logs for the verification OTP code

### Step 2: Verify Email
- **Endpoint**: `POST /api/v1/auth/verify-email`
- **Setup**: Update `{{verification_code}}` variable with the OTP from server logs
- **Expected Response**: Email verification success message

### Step 3: Login User
- **Endpoint**: `POST /api/v1/auth/login`
- **Auto-Setup**: JWT tokens are automatically saved to environment variables
- **Expected Response**: Access token, refresh token, and user data

### Step 4: Test Additional Endpoints
- **Resend Verification**: Test resending verification codes
- **Forgot Password**: Request password reset (check logs for reset OTP)
- **Reset Password**: Complete password reset flow

## Environment Variables

| Variable | Description | Auto-Updated |
|----------|-------------|--------------|
| `base_url` | API base URL | No |
| `test_email` | Test email address | No |
| `test_password` | Test password | No |
| `access_token` | JWT access token | Yes (after login) |
| `refresh_token` | JWT refresh token | Yes (after login) |
| `verification_code` | Email verification OTP | Manual |
| `reset_code` | Password reset OTP | Manual |

## Sample Request/Response Examples

### Registration Request
```json
{
  "fullName": "John Doe",
  "email": "test@yersi.com",
  "password": "password123"
}
```

### Registration Response
```json
{
  "message": "Registration successful. Please check your email to verify your account."
}
```

### Login Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "690d1dc693a33f54ceaa8175",
    "email": "test@yersi.com",
    "fullName": "John Doe",
    "credits": 0,
    "isEmailVerified": true
  }
}
```

## Testing Tips

1. **OTP Codes**: Since email sending may fail in development, check server logs for OTP codes:
   ```
   Email sending failed for test@yersi.com, but OTP 254781 is stored in database
   ```

2. **Sequential Testing**: Run requests in order (1→2→3) for the complete flow

3. **Token Usage**: After login, the access token is automatically used for authenticated endpoints

4. **Error Handling**: Test error scenarios by using invalid credentials or expired codes

## Troubleshooting

- **Server not responding**: Ensure the server is running on port 3000
- **Database errors**: Check MongoDB connection
- **Email errors**: OTP codes are logged to console even if email fails
- **Token errors**: Re-login to refresh tokens

## Security Notes

- Use test credentials only in development
- OTP codes expire after 10-15 minutes
- JWT tokens have 1-hour expiry for access tokens
- Email verification is required before login
