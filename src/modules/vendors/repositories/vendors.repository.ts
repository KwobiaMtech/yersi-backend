import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vendor } from '../schemas/vendor.schema';

@Injectable()
export class VendorsRepository {
  constructor(@InjectModel(Vendor.name) private vendorModel: Model<Vendor>) {}

  async create(vendorData: Partial<Vendor>): Promise<Vendor> {
    const vendor = new this.vendorModel(vendorData);
    return vendor.save();
  }

  async findNearby(
    longitude: number,
    latitude: number,
    serviceId?: string,
    radiusKm: number = 10,
  ): Promise<any[]> {
    const pipeline: any[] = [
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
        $match: { isActive: true },
      },
    ];

    // If serviceId is provided, join with vendor-services collection
    if (serviceId) {
      pipeline.push(
        {
          $lookup: {
            from: 'vendorservices',
            localField: '_id',
            foreignField: 'vendorId',
            as: 'services',
          },
        },
        {
          $match: {
            'services.serviceId': new Types.ObjectId(serviceId),
            'services.isAvailable': true,
          },
        }
      );
    }

    pipeline.push(
      {
        $addFields: {
          distanceKm: { $divide: ['$distanceKm', 1000] },
        },
      },
      { $sort: { distanceKm: 1, rating: -1 } }
    );

    return this.vendorModel.aggregate(pipeline);
  }

  async findAll(serviceId?: string): Promise<any[]> {
    const pipeline: any[] = [
      { $match: { isActive: true } },
    ];

    if (serviceId) {
      pipeline.push(
        {
          $lookup: {
            from: 'vendorservices',
            localField: '_id',
            foreignField: 'vendorId',
            as: 'services',
          },
        },
        {
          $match: {
            'services.serviceId': new Types.ObjectId(serviceId),
            'services.isAvailable': true,
          },
        }
      );
    }

    pipeline.push({ $sort: { rating: -1, name: 1 } });

    return this.vendorModel.aggregate(pipeline);
  }

  async findById(id: string): Promise<Vendor | null> {
    return this.vendorModel.findById(id).exec();
  }

  async findWithServices(id: string): Promise<any> {
    return this.vendorModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'vendorservices',
          localField: '_id',
          foreignField: 'vendorId',
          as: 'services',
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: 'services.serviceId',
          foreignField: '_id',
          as: 'serviceDetails',
        },
      },
    ]);
  }

  async findByService(serviceId: string): Promise<any[]> {
    return this.vendorModel.aggregate([
      {
        $lookup: {
          from: 'vendorservices',
          localField: '_id',
          foreignField: 'vendorId',
          as: 'vendorServices',
        },
      },
      {
        $match: {
          isActive: true,
          'vendorServices.serviceId': new Types.ObjectId(serviceId),
          'vendorServices.isAvailable': true,
        },
      },
      {
        $addFields: {
          serviceDetails: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$vendorServices',
                  cond: { $eq: ['$$this.serviceId', new Types.ObjectId(serviceId)] },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          vendorServices: 0,
        },
      },
      { $sort: { rating: -1, name: 1 } },
    ]);
  }
}