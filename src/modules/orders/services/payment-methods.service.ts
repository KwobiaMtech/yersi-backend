import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AppRequestContext } from '../../../common/context/app-request-context';
import { 
  AddMobileMoneyDto, 
  PaymentMethodResponseDto, 
  UpdatePaymentMethodDto,
  MobileMoneyProvider,
  PaymentMethodType 
} from '../dto/payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private get context() {
    return AppRequestContext.context;
  }

  async addMobileMoneyMethod(addMethodDto: AddMobileMoneyDto): Promise<PaymentMethodResponseDto> {
    // Validate phone number format for Ghana
    if (!this.isValidGhanaPhoneNumber(addMethodDto.phoneNumber)) {
      throw new BadRequestException('Invalid Ghana phone number format');
    }

    // Check if payment method already exists
    const existingMethods = await this.getUserPaymentMethods();
    const duplicate = existingMethods.find(method => 
      method.type === PaymentMethodType.MOBILE_MONEY &&
      method.maskedDetails.includes(this.maskPhoneNumber(addMethodDto.phoneNumber))
    );

    if (duplicate) {
      throw new BadRequestException('This mobile money account is already added');
    }

    // If setting as default, update existing defaults
    if (addMethodDto.setAsDefault) {
      await this.clearDefaultPaymentMethods();
    }

    // Create new payment method
    const paymentMethod: PaymentMethodResponseDto = {
      id: `mm_${Date.now()}`,
      type: PaymentMethodType.MOBILE_MONEY,
      displayName: this.getProviderDisplayName(addMethodDto.provider),
      maskedDetails: this.maskPhoneNumber(addMethodDto.phoneNumber),
      isDefault: addMethodDto.setAsDefault || existingMethods.length === 0, // First method is default
      isVerified: false, // Will be verified via OTP
      createdAt: new Date(),
      nickname: addMethodDto.nickname,
      provider: addMethodDto.provider,
    };

    // Save to cache (in production, save to database)
    const cacheKey = `payment-methods-${this.context.userId}`;
    const updatedMethods = [...existingMethods, paymentMethod];
    await this.cacheManager.set(cacheKey, updatedMethods, 3600);

    // Trigger verification process
    await this.initiateVerification(paymentMethod.id, addMethodDto.phoneNumber);

    return paymentMethod;
  }

  async getUserPaymentMethods(): Promise<PaymentMethodResponseDto[]> {
    const cacheKey = `payment-methods-${this.context.userId}`;
    const cached = await this.cacheManager.get<PaymentMethodResponseDto[]>(cacheKey);
    
    if (cached) return cached;

    // Mock default methods for demo
    const defaultMethods: PaymentMethodResponseDto[] = [
      {
        id: 'mm_default_1',
        type: PaymentMethodType.MOBILE_MONEY,
        displayName: 'MTN Mobile Money',
        maskedDetails: '+233**5***06',
        isDefault: true,
        isVerified: true,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        provider: MobileMoneyProvider.MTN,
      },
    ];

    await this.cacheManager.set(cacheKey, defaultMethods, 3600);
    return defaultMethods;
  }

  async updatePaymentMethod(methodId: string, updateDto: UpdatePaymentMethodDto): Promise<PaymentMethodResponseDto> {
    const methods = await this.getUserPaymentMethods();
    const methodIndex = methods.findIndex(m => m.id === methodId);

    if (methodIndex === -1) {
      throw new NotFoundException('Payment method not found');
    }

    // If setting as default, clear other defaults
    if (updateDto.setAsDefault) {
      methods.forEach(m => m.isDefault = false);
    }

    // Update the method
    methods[methodIndex] = {
      ...methods[methodIndex],
      ...updateDto,
      isDefault: updateDto.setAsDefault ?? methods[methodIndex].isDefault,
    };

    // Save updated methods
    const cacheKey = `payment-methods-${this.context.userId}`;
    await this.cacheManager.set(cacheKey, methods, 3600);

    return methods[methodIndex];
  }

  async deletePaymentMethod(methodId: string): Promise<void> {
    const methods = await this.getUserPaymentMethods();
    const methodIndex = methods.findIndex(m => m.id === methodId);

    if (methodIndex === -1) {
      throw new NotFoundException('Payment method not found');
    }

    const methodToDelete = methods[methodIndex];
    methods.splice(methodIndex, 1);

    // If deleted method was default, set first remaining as default
    if (methodToDelete.isDefault && methods.length > 0) {
      methods[0].isDefault = true;
    }

    // Save updated methods
    const cacheKey = `payment-methods-${this.context.userId}`;
    await this.cacheManager.set(cacheKey, methods, 3600);
  }

  async verifyPaymentMethod(methodId: string, otp: string): Promise<PaymentMethodResponseDto> {
    const methods = await this.getUserPaymentMethods();
    const methodIndex = methods.findIndex(m => m.id === methodId);

    if (methodIndex === -1) {
      throw new NotFoundException('Payment method not found');
    }

    // Mock OTP verification (in production, verify with actual OTP service)
    if (otp !== '123456') {
      throw new BadRequestException('Invalid OTP code');
    }

    // Mark as verified
    methods[methodIndex].isVerified = true;

    // Save updated methods
    const cacheKey = `payment-methods-${this.context.userId}`;
    await this.cacheManager.set(cacheKey, methods, 3600);

    return methods[methodIndex];
  }

  private async clearDefaultPaymentMethods(): Promise<void> {
    const methods = await this.getUserPaymentMethods();
    methods.forEach(method => method.isDefault = false);
    
    const cacheKey = `payment-methods-${this.context.userId}`;
    await this.cacheManager.set(cacheKey, methods, 3600);
  }

  private async initiateVerification(methodId: string, phoneNumber: string): Promise<void> {
    // Mock OTP sending (in production, integrate with SMS service)
    console.log(`Sending OTP to ${phoneNumber} for payment method ${methodId}`);
    
    // Store verification attempt
    const verificationKey = `verification-${methodId}`;
    await this.cacheManager.set(verificationKey, { 
      phoneNumber, 
      attempts: 0,
      createdAt: new Date() 
    }, 300); // 5 minutes
  }

  private isValidGhanaPhoneNumber(phoneNumber: string): boolean {
    // Ghana phone number patterns
    const patterns = [
      /^\+233[0-9]{9}$/, // +233xxxxxxxxx
      /^0[0-9]{9}$/, // 0xxxxxxxxx
    ];
    
    return patterns.some(pattern => pattern.test(phoneNumber));
  }

  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.startsWith('+233')) {
      return `+233**${phoneNumber.slice(-3)}`;
    } else if (phoneNumber.startsWith('0')) {
      return `0**${phoneNumber.slice(-3)}`;
    }
    return phoneNumber;
  }

  private getProviderDisplayName(provider: MobileMoneyProvider): string {
    const names = {
      [MobileMoneyProvider.MTN]: 'MTN Mobile Money',
      [MobileMoneyProvider.TELECEL]: 'Telecel Cash',
      [MobileMoneyProvider.AIRTELTIGO]: 'AirtelTigo Money',
    };
    return names[provider];
  }
}
