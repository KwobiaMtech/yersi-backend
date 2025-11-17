import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VendorService } from '../schemas/vendor-service.schema';

@Injectable()
export class VendorServiceRepository {
  constructor(@InjectModel(VendorService.name) private vendorServiceModel: Model<VendorService>) {}

  async create(vendorServiceData: Partial<VendorService>): Promise<VendorService> {
    const vendorService = new this.vendorServiceModel(vendorServiceData);
    return vendorService.save();
  }

  async findByVendorId(vendorId: string): Promise<VendorService[]> {
    return this.vendorServiceModel
      .find({ vendorId: new Types.ObjectId(vendorId) })
      .populate('serviceId')
      .exec();
  }

  async findByServiceId(serviceId: string): Promise<VendorService[]> {
    return this.vendorServiceModel
      .find({ serviceId: new Types.ObjectId(serviceId) })
      .populate('vendorId')
      .exec();
  }

  async findVendorsWithService(serviceId: string, isAvailable: boolean = true): Promise<VendorService[]> {
    return this.vendorServiceModel
      .find({ 
        serviceId: new Types.ObjectId(serviceId),
        isAvailable 
      })
      .populate('vendorId')
      .exec();
  }
}
