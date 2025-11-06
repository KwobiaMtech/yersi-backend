export interface BrevoEmailSender {
  email: string;
  name: string;
}

export interface BrevoEmailRecipient {
  email: string;
  name?: string;
}

export interface BrevoEmailAttachment {
  content: string; // Base64 encoded content
  name: string;    // File name
}

export interface SendEmailOptions {
  to: BrevoEmailRecipient[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  sender?: BrevoEmailSender;
  attachment?: BrevoEmailAttachment[];
}

export interface InvoiceEmailRequest {
  invoiceId: string;
  subject?: string;
  message?: string;
}

export interface InvoiceEmailResponse {
  invoiceId: string;
  emailSent: boolean;
  trackingToken: string;
  message: string;
}

export interface InvoiceWithDetails {
  invoice: {
    id: string;
    invoiceNumber: string;
    userId: string;
    total: number;
    currency: string;
    dateIssued: Date;
    dateDue: Date;
    trackingToken?: string;
    emailSent?: boolean;
    emailSentAt?: Date;
    emailOpened?: boolean;
    emailOpenedAt?: Date;
    invoiceViewed?: boolean;
    invoiceViewedAt?: Date;
    viewCount?: number;
    lastViewedAt?: Date;
  };
  recipient: {
    name: string;
    email: string;
  };
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export interface EmailTrackingEvent {
  invoiceId: string;
  trackingToken: string;
  eventType: 'email_opened' | 'invoice_viewed';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface ForgotPasswordEmailRequest {
  recipientEmail: string;
  recipientName: string;
  otpCode: string;
  expiryMinutes?: number;
}

export interface OTPEmailRequest {
  recipientEmail: string;
  recipientName: string;
  otpCode: string;
  expiryMinutes?: number;
}

export interface InvoiceTrackingStats {
  invoiceId: string;
  invoiceNumber: string;
  emailSent: boolean;
  emailSentAt?: Date;
  emailOpened: boolean;
  emailOpenedAt?: Date;
  invoiceViewed: boolean;
  invoiceViewedAt?: Date;
  viewCount: number;
  lastViewedAt?: Date;
}
