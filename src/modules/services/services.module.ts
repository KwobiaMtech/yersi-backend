import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesController } from './controllers/services.controller';
import { ServicesService } from './services/services.service';
import { ServicesRepository } from './repositories/services.repository';
import { ServicePackageRepository } from './repositories/service-package.repository';
import { CategoryRepository } from './repositories/category.repository';
import { Service, ServiceSchema } from './schemas/service.schema';
import { ServicePackage, ServicePackageSchema } from './schemas/service-package.schema';
import { Category, CategorySchema } from './schemas/category.schema';
import { ItemsModule } from '../items/items.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: ServicePackage.name, schema: ServicePackageSchema },
      { name: Category.name, schema: CategorySchema }
    ]),
    ItemsModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService, ServicesRepository, ServicePackageRepository, CategoryRepository],
  exports: [ServicesService, ServicesRepository, ServicePackageRepository, CategoryRepository],
})
export class ServicesModule {}