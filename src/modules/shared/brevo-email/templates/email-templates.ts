/**
 * Email Templates for Yersi Laundry Service
 * Contains all HTML and text email templates
 */

export interface EmailTemplateData {
  recipientName: string;
  baseUrl: string;
  [key: string]: any;
}

export interface OTPTemplateData extends EmailTemplateData {
  otpCode: string;
  expiryMinutes: number;
}

export interface WelcomeTemplateData extends EmailTemplateData {
  userEmail?: string;
}

export interface PasswordResetTemplateData extends EmailTemplateData {
  otpCode: string;
  expiryMinutes: number;
}

/**
 * Base HTML template with common styling
 */
const getBaseStyles = (): string => `
  body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    line-height: 1.6; 
    color: #333; 
    margin: 0; 
    padding: 0; 
    background-color: #f4f4f4; 
  }
  .container { 
    max-width: 650px; 
    margin: 0 auto; 
    background-color: white; 
    box-shadow: 0 0 20px rgba(0,0,0,0.1); 
  }
  .content { 
    padding: 40px 30px; 
  }
  .footer { 
    background-color: #1e40af; 
    color: white; 
    padding: 25px; 
    text-align: center; 
  }
  .otp-container { 
    background: linear-gradient(135deg, #3b82f620 0%, #1e40af20 100%); 
    padding: 30px; 
    border-radius: 12px; 
    margin: 30px 0; 
    text-align: center; 
    border: 2px solid #1e40af; 
  }
  .otp-code { 
    font-size: 48px; 
    font-weight: bold; 
    color: #1e40af; 
    letter-spacing: 8px; 
    margin: 20px 0; 
    font-family: 'Courier New', monospace; 
    text-shadow: 2px 2px 4px rgba(0,0,0,0.1); 
  }
  .otp-label { 
    font-size: 18px; 
    color: #666; 
    margin-bottom: 15px; 
    font-weight: 600; 
  }
`;

/**
 * Welcome Email Templates
 */
export class WelcomeEmailTemplate {
  static getHTML(data: WelcomeTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to Yersi - Your Laundry Service Journey Begins!</title>
    <style>
        ${getBaseStyles()}
        .header { 
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 32px; 
          font-weight: 300; 
        }
        .header p { 
          margin: 10px 0 0 0; 
          opacity: 0.9; 
          font-size: 16px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧺 Yersi</h1>
            <p>Your Premium Laundry Service</p>
        </div>
        
        <div class="content">
            <h2 style="color: #1e40af; margin-bottom: 10px;">🎯 Welcome to Yersi!</h2>
            
            <p>Hello <strong>${data.recipientName}</strong>,</p>
            
            <p>Welcome to Yersi, your trusted laundry service partner! You now have access to convenient, professional laundry services right at your fingertips. We're here to make your laundry experience effortless and reliable.</p>
            
            <p>With Yersi, you can:</p>
            <ul style="color: #555; line-height: 1.8;">
                <li>📱 Schedule pickup and delivery at your convenience</li>
                <li>🏪 Find trusted laundry vendors near you</li>
                <li>💳 Pay securely through multiple payment options</li>
                <li>📊 Track your orders in real-time</li>
                <li>🎁 Enjoy exclusive promotions and discounts</li>
            </ul>
            
            <p>Thank you for choosing Yersi. We look forward to serving you!</p>
        </div>
        
        <div class="footer">
            <p><strong>🧺 Welcome to Professional Laundry Care</strong></p>
            <p>Your clothes deserve the best treatment</p>
            <p style="margin: 15px 0 5px 0;">Yersi Laundry Service | Trusted Since 2024</p>
            <p style="margin: 0; opacity: 0.8;">© 2024 Yersi. All rights reserved. | Privacy Policy | Terms of Service</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">
                Professional laundry services with care and attention to detail.
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  static getText(data: WelcomeTemplateData): string {
    return `
Yersi - Welcome to Your Laundry Service!

Hello ${data.recipientName},

🧺 WELCOME TO YERSI! 🧺

Welcome to Yersi, your trusted laundry service partner! You now have access to convenient, professional laundry services right at your fingertips.

With Yersi, you can:
- Schedule pickup and delivery at your convenience
- Find trusted laundry vendors near you
- Pay securely through multiple payment options
- Track your orders in real-time
- Enjoy exclusive promotions and discounts

Thank you for choosing Yersi!

Best regards,
The Yersi Team
Your Trusted Laundry Service Partner

© 2024 Yersi. All rights reserved.
    `.trim();
  }
}

/**
 * OTP Email Templates
 */
export class OTPEmailTemplate {
  static getHTML(data: OTPTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Your Yersi Verification Code</title>
    <style>
        ${getBaseStyles()}
        .header { 
          background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 32px; 
          font-weight: 300; 
        }
        .header p { 
          margin: 10px 0 0 0; 
          opacity: 0.9; 
          font-size: 16px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧺 Yersi</h1>
            <p>Premium Laundry Service</p>
        </div>
        
        <div class="content">
            <h2 style="color: #1e40af; margin-bottom: 10px;">🔐 Verification Code Required</h2>
            
            <p>Hello <strong>${data.recipientName}</strong>,</p>
            
            <p>You've requested a verification code for your Yersi account. Use the code below to complete your authentication:</p>
            
            <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${data.otpCode}</div>
                <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
                    <strong>Valid for ${data.expiryMinutes} minutes only</strong>
                </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If you didn't request this code, please ignore this email or contact our support team.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>🔐 Secure Verification Service</strong></p>
            <p>This verification email was sent to protect your account</p>
            <p style="margin: 15px 0 5px 0;">Yersi Laundry Service | Trusted Since 2024</p>
            <p style="margin: 0; opacity: 0.8;">© 2024 Yersi. All rights reserved. | Privacy Policy | Terms of Service</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">
                This email was sent to verify your identity for secure access to your laundry service account.
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  static getText(data: OTPTemplateData): string {
    return `
Yersi - Verification Code Required

Hello ${data.recipientName},

You've requested a verification code for your Yersi account.

Your Verification Code: ${data.otpCode}
Valid for: ${data.expiryMinutes} minutes only

If you didn't request this code, please contact our support team.

Best regards,
The Yersi Security Team
Your Trusted Laundry Service Partner

© 2024 Yersi. All rights reserved.
    `.trim();
  }
}

/**
 * Password Reset Email Templates
 */
export class PasswordResetEmailTemplate {
  static getHTML(data: PasswordResetTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset Your Yersi Password</title>
    <style>
        ${getBaseStyles()}
        .header { 
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 32px; 
          font-weight: 300; 
        }
        .header p { 
          margin: 10px 0 0 0; 
          opacity: 0.9; 
          font-size: 16px; 
        }
        .password-reset-container { 
          background: linear-gradient(135deg, #dc262620 0%, #b91c1c20 100%); 
          padding: 30px; 
          border-radius: 12px; 
          margin: 30px 0; 
          text-align: center; 
          border: 2px solid #dc2626; 
        }
        .reset-code { 
          font-size: 48px; 
          font-weight: bold; 
          color: #dc2626; 
          letter-spacing: 8px; 
          margin: 20px 0; 
          font-family: 'Courier New', monospace; 
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1); 
        }
        .reset-label { 
          font-size: 18px; 
          color: #666; 
          margin-bottom: 15px; 
          font-weight: 600; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Yersi</h1>
            <p>Password Reset Request</p>
        </div>
        
        <div class="content">
            <h2 style="color: #dc2626; margin-bottom: 10px;">🔑 Password Reset Code</h2>
            
            <p>Hello <strong>${data.recipientName}</strong>,</p>
            
            <p>We received a request to reset your Yersi account password. If you made this request, use the verification code below to proceed with resetting your password:</p>
            
            <div class="password-reset-container">
                <div class="reset-label">Password Reset Code</div>
                <div class="reset-code">${data.otpCode}</div>
                <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
                    <strong>Valid for ${data.expiryMinutes} minutes only</strong>
                </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If you didn't request this password reset, please ignore this email or contact our support team immediately.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>🔐 Secure Password Reset Service</strong></p>
            <p>This password reset email was sent to protect your account</p>
            <p style="margin: 15px 0 5px 0;">Yersi Laundry Service | Trusted Since 2024</p>
            <p style="margin: 0; opacity: 0.8;">© 2024 Yersi. All rights reserved. | Privacy Policy | Terms of Service</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">
                This email was sent in response to a password reset request for your laundry service account.
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  static getText(data: PasswordResetTemplateData): string {
    return `
Yersi - Password Reset Request

Hello ${data.recipientName},

We received a request to reset your Yersi account password.

Your Password Reset Code: ${data.otpCode}
Valid for: ${data.expiryMinutes} minutes only

If you didn't request this password reset, please contact our support team immediately.

Best regards,
The Yersi Security Team
Your Trusted Laundry Service Partner

© 2024 Yersi. All rights reserved.
    `.trim();
  }
}

/**
 * Template Factory for easy template access
 */
export class EmailTemplateFactory {
  static getWelcomeTemplate(data: WelcomeTemplateData) {
    return {
      html: WelcomeEmailTemplate.getHTML(data),
      text: WelcomeEmailTemplate.getText(data),
    };
  }

  static getOTPTemplate(data: OTPTemplateData) {
    return {
      html: OTPEmailTemplate.getHTML(data),
      text: OTPEmailTemplate.getText(data),
    };
  }

  static getPasswordResetTemplate(data: PasswordResetTemplateData) {
    return {
      html: PasswordResetEmailTemplate.getHTML(data),
      text: PasswordResetEmailTemplate.getText(data),
    };
  }
}