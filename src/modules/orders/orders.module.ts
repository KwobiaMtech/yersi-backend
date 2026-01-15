import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './controllers/orders.controller';
import { PaymentMethodsController } from './controllers/payment-methods.controller';
import { OrdersService } from './services/orders.service';
import { PaymentMethodsService } from './services/payment-methods.service';
import { OrderMappingService } from './services/order-mapping.service';
import { OrdersRepository } from './repositories/orders.repository';
import { Order, OrderSchema } from './schemas/order.schema';
import { ItemsModule } from '../items/items.module';
import { VendorsModule } from '../vendors/vendors.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ItemsModule,
    VendorsModule,
    PromotionsModule,
    ServicesModule,
  ],
  controllers: [OrdersController, PaymentMethodsController],
  providers: [OrdersService, PaymentMethodsService, OrdersRepository, OrderMappingService],
  exports: [OrdersService, PaymentMethodsService, OrdersRepository, OrderMappingService],
})
export class OrdersModule {}