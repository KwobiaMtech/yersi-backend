import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './services/payments.service';
import { PaymentsRepository } from './repositories/payments.repository';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { SeevcashProvider } from './providers/seevcash.provider';
import { PaymentProviderFactory } from './factories/payment-provider.factory';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    ConfigModule,
    OrdersModule,
    UsersModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsRepository,
    SeevcashProvider,
    PaymentProviderFactory,
  ],
  exports: [PaymentsService, PaymentsRepository],
})
export class PaymentsModule {}