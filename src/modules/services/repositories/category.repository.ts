import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from '../schemas/category.schema';
import { Service } from '../schemas/service.schema';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Service.name) private serviceModel: Model<Service>
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find({ isActive: true }).exec();
  }

  async findByServiceId(serviceId: string): Promise<Category[]> {
    return this.categoryModel.find({ serviceId: serviceId, isActive: true }).exec();
  }

  async create(categoryData: Partial<Category>): Promise<Category> {
    const service = await this.serviceModel.findOne({ id: categoryData.serviceId }).exec();
    if (!service) {
      throw new Error('Service not found');
    }
    
    const categoryWithObjectId = {
      ...categoryData,
      serviceId: service._id.toString()
    };
    
    return this.categoryModel.create(categoryWithObjectId);
  }
}
