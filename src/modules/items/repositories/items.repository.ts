import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item } from '../schemas/item.schema';

@Injectable()
export class ItemsRepository {
  constructor(@InjectModel(Item.name) private itemModel: Model<Item>) {}

  async findByService(serviceId: string): Promise<Item[]> {
    return this.itemModel
      .find({
        compatibleServices: serviceId,
        isActive: true,
      })
      .exec();
  }

  async findById(id: string): Promise<Item | null> {
    return this.itemModel.findOne({ id, isActive: true }).exec();
  }

  async findByIds(ids: string[]): Promise<Item[]> {
    return this.itemModel.find({ id: { $in: ids }, isActive: true }).exec();
  }

  async findByCategory(categoryId: string): Promise<Item[]> {
    return this.itemModel.find({ categoryId: new Types.ObjectId(categoryId), isActive: true }).exec();
  }

  async create(itemData: Partial<Item>): Promise<Item> {
    return this.itemModel.create(itemData);
  }
}