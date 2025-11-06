import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import {
    SendEmailOptions,
    BrevoEmailSender,
} from './interfaces/brevo-email.interface';
import {
    EmailTemplateFactory,
    WelcomeTemplateData,
    OTPTemplateData,
    PasswordResetTemplateData,
} from './templates';
import { EmailUtils } from './utils/email-utils';

@Injectable()
export class BrevoEmailService {
    private readonly logger = new Logger(BrevoEmailService.name);
    private readonly brevoClient: SibApiV3Sdk.TransactionalEmailsApi;
    private readonly fromEmail: string;
    private readonly fromName: string;
    private readonly baseUrl: string;

    constructor (private readonly configService: ConfigService) {
        // Initialize Brevo client
        const apiKey = this.configService.get<string>('BREVO_API_KEY');
        if (!apiKey) {
            this.logger.warn('BREVO_API_KEY not configured. Email sending will be simulated.');
        }

        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKeyAuth = defaultClient.authentications['api-key'];
        apiKeyAuth.apiKey = apiKey;

        this.brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();

        // Load configuration
        this.fromEmail = this.configService.get<string>('SENDER_EMAIL', 'noreply@yersi.com');
        this.fromName = this.configService.get<string>('SENDER_NAME', 'Yersi');
        this.baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000');
    }

    /**
     * Send a basic email using Brevo
     */
    async sendEmail(options: SendEmailOptions): Promise<void> {
        try {
            const sender: BrevoEmailSender = options.sender || {
                email: this.fromEmail,
                name: this.fromName,
            };

            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
            sendSmtpEmail.sender = sender;
            sendSmtpEmail.to = options.to;
            sendSmtpEmail.subject = options.subject;
            sendSmtpEmail.htmlContent = options.htmlContent;
            sendSmtpEmail.textContent = options.textContent;

            // Add attachments if provided
            if (options.attachment && options.attachment.length > 0) {
                (sendSmtpEmail as any).attachment = options.attachment;
            }

            const result = await this.brevoClient.sendTransacEmail(sendSmtpEmail);

            this.logger.log(`Email sent successfully. Message ID: ${result.messageId}`);
        } catch (error) {
            this.logger.error('Failed to send email via Brevo:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    /**
     * Send welcome email using template
     */
    async sendWelcomeEmail(
        recipientEmail: string,
        recipientName: string = 'Valued Customer'
    ): Promise<void> {
        const recipient = EmailUtils.validateRecipient(recipientEmail, recipientName);

        const templateData: WelcomeTemplateData = {
            recipientName: recipient.name,
            baseUrl: this.baseUrl,
            userEmail: recipient.email,
        };

        const template = EmailTemplateFactory.getWelcomeTemplate(templateData);
        const subject = `🧺 Welcome to Yersi, ${recipient.name}! Your Laundry Service is Ready`;

        await this.sendEmail({
            to: [{ email: recipient.email, name: recipient.name }],
            subject,
            htmlContent: template.html,
            textContent: template.text,
        });

        const maskedEmail = EmailUtils.maskEmail(recipient.email);
        const deliveryTime = EmailUtils.getEstimatedDeliveryTime(recipient.email);
        this.logger.log(`Welcome email sent successfully to: ${maskedEmail} (ETA: ${deliveryTime})`);
    }

    /**
     * Send OTP verification email using template
     */
    async sendOTPEmail(
        recipientEmail: string,
        recipientName: string,
        otpCode?: string,
        expiryMinutes: number = 10
    ): Promise<void> {
        const recipient = EmailUtils.validateRecipient(recipientEmail, recipientName);
        const generatedOTP = otpCode || EmailUtils.generateOTP(6);

        const templateData: OTPTemplateData = {
            recipientName: recipient.name,
            baseUrl: this.baseUrl,
            otpCode: generatedOTP,
            expiryMinutes,
        };

        const template = EmailTemplateFactory.getOTPTemplate(templateData);
        const subject = `🔐 Your Yersi Verification Code: ${generatedOTP}`;

        await this.sendEmail({
            to: [{ email: recipient.email, name: recipient.name }],
            subject,
            htmlContent: template.html,
            textContent: template.text,
        });

        const maskedEmail = EmailUtils.maskEmail(recipient.email);
        const deliveryTime = EmailUtils.getEstimatedDeliveryTime(recipient.email);
        this.logger.log(`OTP email sent successfully to: ${maskedEmail} (ETA: ${deliveryTime})`);
    }

    /**
     * Send password reset email using template
     */
    async sendForgotPasswordEmail(
        recipientEmail: string,
        recipientName: string,
        otpCode?: string,
        expiryMinutes: number = 15
    ): Promise<void> {
        const recipient = EmailUtils.validateRecipient(recipientEmail, recipientName);
        const generatedOTP = otpCode || EmailUtils.generateOTP(6);

        const templateData: PasswordResetTemplateData = {
            recipientName: recipient.name,
            baseUrl: this.baseUrl,
            otpCode: generatedOTP,
            expiryMinutes,
        };

        const template = EmailTemplateFactory.getPasswordResetTemplate(templateData);
        const subject = `🔑 Reset Your Yersi Password - Code: ${generatedOTP}`;

        await this.sendEmail({
            to: [{ email: recipient.email, name: recipient.name }],
            subject,
            htmlContent: template.html,
            textContent: template.text,
        });

        const maskedEmail = EmailUtils.maskEmail(recipient.email);
        const deliveryTime = EmailUtils.getEstimatedDeliveryTime(recipient.email);
        this.logger.log(`Password reset email sent successfully to: ${maskedEmail} (ETA: ${deliveryTime})`);
    }


}
