import { Injectable } from '@nestjs/common';
import { PromotionsRepository } from '../repositories/promotions.repository';

@Injectable()
export class PromotionsService {
  constructor(private promotionsRepository: PromotionsRepository) {}

  async validatePromoCode(code: string, orderTotal: number, userId: string) {
    const promotion = await this.promotionsRepository.findByCode(code);

    if (!promotion) {
      return { isValid: false, message: 'Invalid promo code' };
    }

    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      return { isValid: false, message: 'Promo code usage limit exceeded' };
    }

    if (orderTotal < promotion.minimumOrderAmount) {
      return { 
        isValid: false, 
        message: `Minimum order amount is ${promotion.minimumOrderAmount} GHS` 
      };
    }

    let discountAmount = 0;
    if (promotion.discountType === 'fixed') {
      discountAmount = promotion.discountValue;
    } else {
      discountAmount = (orderTotal * promotion.discountValue) / 100;
    }

    if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
      discountAmount = promotion.maxDiscountAmount;
    }

    return {
      isValid: true,
      discountAmount,
      promotion: {
        code: promotion.code,
        description: promotion.description,
        discountAmount,
      },
    };
  }

  async applyPromoCode(code: string): Promise<void> {
    const promotion = await this.promotionsRepository.findByCode(code);
    if (promotion) {
      await this.promotionsRepository.incrementUsage(promotion._id);
    }
  }
}