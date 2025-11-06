import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OTP, OTPType } from '../schemas/otp.schema';

@Injectable()
export class OTPRepository {
  constructor(@InjectModel(OTP.name) private otpModel: Model<OTP>) {}

  async create(email: string, code: string, type: OTPType, expiryMinutes: number = 10): Promise<OTP> {
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    return this.otpModel.create({ email, code, type, expiresAt });
  }

  async findValidOTP(email: string, code: string, type: OTPType): Promise<OTP | null> {
    return this.otpModel.findOne({
      email,
      code,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });
  }

  async markAsUsed(id: string): Promise<void> {
    await this.otpModel.findByIdAndUpdate(id, { isUsed: true });
  }

  async incrementAttempts(email: string, type: OTPType): Promise<void> {
    await this.otpModel.updateMany(
      { email, type, isUsed: false },
      { $inc: { attempts: 1 } }
    );
  }

  async deleteExpiredOTPs(email: string, type: OTPType): Promise<void> {
    await this.otpModel.deleteMany({
      email,
      type,
      $or: [
        { isUsed: true },
        { expiresAt: { $lt: new Date() } }
      ]
    });
  }
}
