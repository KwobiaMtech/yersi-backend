import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServicePackage } from '../schemas/service-package.schema';

@Injectable()
export class ServicePackageRepository {
  constructor(@InjectModel(ServicePackage.name) private packageModel: Model<ServicePackage>) {}

  async findByServiceId(serviceId: string): Promise<ServicePackage[]> {
    return this.packageModel.find({ serviceId: new Types.ObjectId(serviceId), isActive: true }).exec();
  }

  async create(packageData: Partial<ServicePackage>): Promise<ServicePackage> {
    return this.packageModel.create(packageData);
  }
}
