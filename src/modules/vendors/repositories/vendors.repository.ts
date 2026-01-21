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
    console.log('findNearby called with:', { longitude, latitude, serviceId, radiusKm });
    
    const pipeline: any[] = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          distanceField: 'distanceMeters',
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
          distanceKm: { 
            $round: [{ $divide: ['$distanceMeters', 1000] }, 2] 
          },
        },
      },
      { $sort: { distanceKm: 1, rating: -1 } }
    );

    const results = await this.vendorModel.aggregate(pipeline);
    console.log('Vendors found:', results.length);
    if (results.length > 0) {
      console.log('First vendor distance:', results[0].distanceKm, 'km');
    }
    return results;
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

  async findServicesOfferedByVendor(vendorId: string): Promise<any[]> {
    return this.vendorModel.aggregate([
      { $match: { _id: new Types.ObjectId(vendorId), isActive: true } },
      {
        $lookup: {
          from: 'vendorservices',
          localField: '_id',
          foreignField: 'vendorId',
          as: 'vendorServices',
        },
      },
      { $unwind: '$vendorServices' },
      { $match: { 'vendorServices.isAvailable': true } },
      {
        $lookup: {
          from: 'services',
          localField: 'vendorServices.serviceId',
          foreignField: '_id',
          as: 'serviceInfo',
        },
      },
      { $unwind: '$serviceInfo' },
      {
        $project: {
          _id: '$serviceInfo._id',
          name: '$serviceInfo.name',
          description: '$serviceInfo.description',
          icon: '$serviceInfo.icon',
          colorTheme: '$serviceInfo.colorTheme',
          basePrice: '$serviceInfo.basePrice',
          vendorPrice: '$vendorServices.price',
          turnaroundHours: '$vendorServices.turnaroundHours',
          minimumOrder: '$vendorServices.minimumOrder',
          specialFeatures: '$vendorServices.specialFeatures',
          isAvailable: '$vendorServices.isAvailable',
        },
      },
      { $sort: { name: 1 } },
    ]);
  }
}