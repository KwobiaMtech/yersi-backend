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

  async findById(categoryId: string): Promise<Category | null> {
    const query: any = { isActive: true };
    
    if (Types.ObjectId.isValid(categoryId)) {
      query.$or = [
        { _id: new Types.ObjectId(categoryId) },
        { id: categoryId }
      ];
    } else {
      query.id = categoryId;
    }
    
    return this.categoryModel.findOne(query).exec();
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
