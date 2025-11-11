import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './controllers/admin.controller';
import { VendorAdminController } from './controllers/vendor-admin.controller';
import { AdminServicesController } from './controllers/admin-services.controller';
import { AdminItemsController } from './controllers/admin-items.controller';
import { AdminService } from './services/admin.service';
import { VendorAdminService } from './services/vendor-admin.service';
import { Admin, AdminSchema } from './schemas/admin.schema';
import { VendorsModule } from '../vendors/vendors.module';
import { ServicesModule } from '../services/services.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { ItemsModule } from '../items/items.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      signOptions: { expiresIn: '24h' },
    }),
    VendorsModule,
    ServicesModule,
    OrdersModule,
    UsersModule,
    ItemsModule,
  ],
  controllers: [AdminController, VendorAdminController, AdminServicesController, AdminItemsController],
  providers: [AdminService, VendorAdminService],
  exports: [AdminService],
})
export class AdminModule {}
