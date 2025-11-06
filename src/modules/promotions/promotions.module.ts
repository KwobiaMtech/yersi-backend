import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromotionsService } from './services/promotions.service';
import { PromotionsRepository } from './repositories/promotions.repository';
import { Promotion, PromotionSchema } from './schemas/promotion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Promotion.name, schema: PromotionSchema }]),
  ],
  providers: [PromotionsService, PromotionsRepository],
  exports: [PromotionsService, PromotionsRepository],
})
export class PromotionsModule {}