import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Mongoose } from "mongoose";
import { Service } from "../schemas/service.schema";

@Injectable()
export class ServicesRepository {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<Service>
  ) {}

  async findAll(): Promise<Service[]> {
    return this.serviceModel.find({ isActive: true }).exec();
  }

  async findById(id: string): Promise<Service | null> {
    return this.serviceModel
      .findOne({ _id: new mongoose.Types.ObjectId(id), isActive: true })
      .exec();
  }

  async create(serviceData: Partial<Service>): Promise<Service> {
    return this.serviceModel.create(serviceData);
  }
}
