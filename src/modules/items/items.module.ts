import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemsController } from './controllers/items.controller';
import { ItemsService } from './services/items.service';
import { ItemsRepository } from './repositories/items.repository';
import { Item, ItemSchema } from './schemas/item.schema';
import { Category, CategorySchema } from '../services/schemas/category.schema';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: Category.name, schema: CategorySchema }
    ]),
    forwardRef(() => ServicesModule),
  ],
  controllers: [ItemsController],
  providers: [ItemsService, ItemsRepository],
  exports: [ItemsService, ItemsRepository],
})
export class ItemsModule {}