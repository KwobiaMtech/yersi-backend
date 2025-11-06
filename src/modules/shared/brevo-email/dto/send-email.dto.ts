import { IsEmail, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EmailRecipientDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class SendEmailDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  to: EmailRecipientDto[];

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  htmlContent?: string;

  @IsOptional()
  @IsString()
  textContent?: string;
}

export class InvoiceEmailRequestDto {
  @IsString()
  invoiceId: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

export class ForgotPasswordEmailRequestDto {
  @IsEmail()
  recipientEmail: string;

  @IsString()
  recipientName: string;

  @IsString()
  otpCode: string;

  @IsOptional()
  @IsString()
  expiryMinutes?: number;
}

export class OTPEmailRequestDto {
  @IsEmail()
  recipientEmail: string;

  @IsString()
  recipientName: string;

  @IsString()
  otpCode: string;

  @IsOptional()
  @IsString()
  expiryMinutes?: number;
}

export class TrackEmailOpenDto {
  @IsString()
  trackingToken: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
