import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthRepository } from '../repositories/auth.repository';
import { OTPRepository } from '../repositories/otp.repository';
import { RegisterDto, LoginDto, VerifyEmailDto, ResendVerificationDto, ForgotPasswordDto, ResetPasswordDto } from '../dto/auth.dto';
import { AuthResponse, JwtPayload } from '../interfaces/auth.interface';
import { OTPType } from '../schemas/otp.schema';
import { EmailService } from '../../shared/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private otpRepository: OTPRepository,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const existingUser = await this.authRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    await this.authRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    await this.sendVerificationEmail(registerDto.email, registerDto.fullName);
    
    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const { email, code } = verifyEmailDto;
    
    const otp = await this.otpRepository.findValidOTP(email, code, OTPType.EMAIL_VERIFICATION);
    if (!otp) {
      await this.otpRepository.incrementAttempts(email, OTPType.EMAIL_VERIFICATION);
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.authRepository.verifyEmail(email);
    await this.otpRepository.markAsUsed(otp._id);
    await this.otpRepository.deleteExpiredOTPs(email, OTPType.EMAIL_VERIFICATION);

    return { message: 'Email verified successfully. You can now login.' };
  }

  async resendVerification(resendDto: ResendVerificationDto): Promise<{ message: string }> {
    const user = await this.authRepository.findByEmail(resendDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.sendVerificationEmail(user.email, user.fullName);
    
    return { message: 'Verification email sent successfully' };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.authRepository.findByEmail(loginDto.email);
    if (!user || !await bcrypt.compare(loginDto.password, user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    return this.generateTokens(user);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.authRepository.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Don't reveal if email exists or not
      return { message: 'If the email exists, a password reset code has been sent' };
    }

    await this.sendPasswordResetEmail(user.email, user.fullName);
    
    return { message: 'If the email exists, a password reset code has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email, code, newPassword } = resetPasswordDto;
    
    const otp = await this.otpRepository.findValidOTP(email, code, OTPType.PASSWORD_RESET);
    if (!otp) {
      await this.otpRepository.incrementAttempts(email, OTPType.PASSWORD_RESET);
      throw new BadRequestException('Invalid or expired reset code');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.authRepository.updatePassword(email, hashedPassword);
    await this.otpRepository.markAsUsed(otp._id);
    await this.otpRepository.deleteExpiredOTPs(email, OTPType.PASSWORD_RESET);

    return { message: 'Password reset successfully' };
  }

  private async sendVerificationEmail(email: string, firstName: string): Promise<void> {
    await this.otpRepository.deleteExpiredOTPs(email, OTPType.EMAIL_VERIFICATION);
    
    const code = this.generateOTP();
    await this.otpRepository.create(email, code, OTPType.EMAIL_VERIFICATION, 10);
    
    try {
      await this.emailService.sendOTPEmail({
        email,
        name: firstName,
        otpCode: code,
        expiryMinutes: 10,
      });
    } catch (error) {
      console.log(`Email sending failed for ${email}, but OTP ${code} is stored in database`);
    }
  }

  private async sendPasswordResetEmail(email: string, firstName: string): Promise<void> {
    await this.otpRepository.deleteExpiredOTPs(email, OTPType.PASSWORD_RESET);
    
    const code = this.generateOTP();
    await this.otpRepository.create(email, code, OTPType.PASSWORD_RESET, 15);
    
    try {
      await this.emailService.sendPasswordResetEmail({
        email,
        name: firstName,
        otpCode: code,
        expiryMinutes: 15,
      });
    } catch (error) {
      console.log(`Password reset email failed for ${email}, but OTP ${code} is stored in database`);
    }
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateTokens(user: any): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: user._id, email: user.email };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.authRepository.updateRefreshToken(user._id, refresh_token);

    return {
      access_token,
      refresh_token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        credits: user.credits,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }
}