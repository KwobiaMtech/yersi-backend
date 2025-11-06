import { Injectable, OnModuleInit } from "@nestjs/common";
import * as SendGrid from "@sendgrid/mail";
import { BrevoEmailService } from "../brevo-email/brevo-email.service";

interface EmailRecipient {
  email: string;
  name: string;
  otpCode: string;
  expiryMinutes: number;
}

@Injectable()
export class EmailService {
  constructor(private readonly brevoEmailService: BrevoEmailService) {}

  async send(mail: SendGrid.MailDataRequired) {
    // Use BrevoEmailService for sending emails
    await this.brevoEmailService.sendEmail({
      to: Array.isArray(mail.to)
        ? mail.to.map((email) => ({
            email: typeof email === "string" ? email : email.email,
          }))
        : [{ email: typeof mail.to === "string" ? mail.to : mail.to.email }],
      subject: mail.subject || "",
      htmlContent: mail.html || "",
      textContent: mail.text || "",
    });
    return { success: true };
  }

  async sendOTPEmail(recipient: EmailRecipient) {
    await this.brevoEmailService.sendOTPEmail(
      recipient.email.toLowerCase(),
      recipient.name,
      recipient.otpCode,
      recipient.expiryMinutes
    );
    return { success: true };
  }

  async sendPasswordResetEmail(recipient: EmailRecipient) {
    await this.brevoEmailService.sendForgotPasswordEmail(
      recipient.email.toLowerCase(),
      recipient.name,
      recipient.otpCode,
      recipient.expiryMinutes
    );
    return { success: true };
  }

  async verifySendOtp(email: string, otp: string) {
    // Use BrevoEmailService for OTP verification
    await this.brevoEmailService.sendOTPEmail(
      email.toLowerCase(),
      "Valued Customer",
      otp,
      10 // 10 minutes expiry
    );
    return { success: true };
  }

  async sendOtp(email: string, otp: string, validate?: boolean) {
    // Use BrevoEmailService for OTP sending
    await this.brevoEmailService.sendOTPEmail(
      email.toLowerCase(),
      "Valued Customer",
      otp,
      10 // 10 minutes expiry
    );
    return { success: true };
  }

  async sendForgotPasswordEmail(email: string, otp: string) {
    // Use BrevoEmailService for forgot password email
    await this.brevoEmailService.sendForgotPasswordEmail(
      email.toLowerCase(),
      "Valued Customer",
      otp,
      15 // 15 minutes expiry
    );
    return { success: true };
  }

  async sendWelcomeEmail(email: string) {
    // Use BrevoEmailService for welcome email
    await this.brevoEmailService.sendWelcomeEmail(
      email.toLowerCase(),
      "Valued Customer"
    );
    return { success: true };
  }
}
