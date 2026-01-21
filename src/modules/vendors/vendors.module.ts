import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorsController } from './controllers/vendors.controller';
import { VendorsService } from './services/vendors.service';
import { VendorsRepository } from './repositories/vendors.repository';
import { VendorServiceRepository } from './repositories/vendor-service.repository';
import { Vendor, VendorSchema } from './schemas/vendor.schema';
import { VendorService, VendorServiceSchema } from './schemas/vendor-service.schema';
import { LocationModule } from '../location/location.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vendor.name, schema: VendorSchema },
      { name: VendorService.name, schema: VendorServiceSchema },
    ]),
    forwardRef(() => LocationModule),
    forwardRef(() => OrdersModule),
  ],
  controllers: [VendorsController],
  providers: [VendorsService, VendorsRepository, VendorServiceRepository],
  exports: [VendorsService, VendorsRepository, VendorServiceRepository],
})
export class VendorsModule {}