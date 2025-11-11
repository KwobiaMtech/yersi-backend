import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from '../schemas/category.schema';

@Injectable()
export class CategoryRepository {
  constructor(@InjectModel(Category.name) private categoryModel: Model<Category>) {}

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find({ isActive: true }).exec();
  }

  async findByServiceId(serviceId: string): Promise<Category[]> {
    return this.categoryModel.find({ serviceId: new Types.ObjectId(serviceId), isActive: true }).exec();
  }

  async create(categoryData: Partial<Category>): Promise<Category> {
    return this.categoryModel.create(categoryData);
  }
}
