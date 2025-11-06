import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vendor } from '../schemas/vendor.schema';

@Injectable()
export class VendorsRepository {
  constructor(@InjectModel(Vendor.name) private vendorModel: Model<Vendor>) {}

  async findNearby(
    longitude: number,
    latitude: number,
    serviceId?: string,
    radiusKm: number = 10,
  ): Promise<Vendor[]> {
    const matchConditions: any = {
      isActive: true,
    };

    if (serviceId) {
      matchConditions.services = serviceId;
    }

    return this.vendorModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          distanceField: 'distanceKm',
          maxDistance: radiusKm * 1000,
          spherical: true,
        },
      },
      {
        $match: matchConditions,
      },
      {
        $addFields: {
          distanceKm: { $divide: ['$distanceKm', 1000] },
        },
      },
      { $sort: { distanceKm: 1, rating: -1 } },
    ]);
  }

  async findAll(serviceId?: string): Promise<Vendor[]> {
    const query: any = { isActive: true };
    
    if (serviceId) {
      query.services = serviceId;
    }

    return this.vendorModel.find(query).sort({ rating: -1, name: 1 }).exec();
  }

  async findById(id: string): Promise<Vendor | null> {
    return this.vendorModel.findById(id).exec();
  }
}