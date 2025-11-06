import { Module, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { CacheModule } from "@nestjs/cache-manager";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { redisStore } from "cache-manager-redis-store";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ServicesModule } from "./modules/services/services.module";
import { VendorsModule } from "./modules/vendors/vendors.module";
import { ItemsModule } from "./modules/items/items.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { PromotionsModule } from "./modules/promotions/promotions.module";
import { HealthModule } from "./health/health.module";
import { LocationModule } from "./modules/location/location.module";
import { AdminModule } from "./modules/admin/admin.module";

import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ThrottleGuard } from "./common/guards/throttle.guard";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { RequestContextMiddleware } from "./common/middleware/request-context.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || "mongodb://localhost:27017/laundry-service"
    ),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT) || 6379,
          },
          password: process.env.REDIS_PASSWORD,
        });
        return {
          store: () => store,
          ttl: 300,
        };
      },
    }),
    AuthModule,
    UsersModule,
    ServicesModule,
    VendorsModule,
    ItemsModule,
    OrdersModule,
    PaymentsModule,
    PromotionsModule,
    HealthModule,
    LocationModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottleGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_PIPE, useClass: ValidationPipe },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
  }
}
