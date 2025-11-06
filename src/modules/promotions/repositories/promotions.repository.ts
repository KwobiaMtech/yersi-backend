import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Promotion } from '../schemas/promotion.schema';

@Injectable()
export class PromotionsRepository {
  constructor(@InjectModel(Promotion.name) private promotionModel: Model<Promotion>) {}

  async findByCode(code: string): Promise<Promotion | null> {
    return this.promotionModel.findOne({ 
      code, 
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    }).exec();
  }

  async incrementUsage(id: string): Promise<void> {
    await this.promotionModel.findByIdAndUpdate(id, { $inc: { usedCount: 1 } }).exec();
  }
}