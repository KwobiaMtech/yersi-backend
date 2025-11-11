import { Injectable, Inject, HttpException } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { ServicesRepository } from "../repositories/services.repository";
import { ServicePackageRepository } from "../repositories/service-package.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { ItemsRepository } from "../../items/repositories/items.repository";

@Injectable()
export class ServicesService {
  constructor(
    private servicesRepository: ServicesRepository,
    private servicePackageRepository: ServicePackageRepository,
    private categoryRepository: CategoryRepository,
    private itemsRepository: ItemsRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getServices() {
    const cacheKey = "services:all";
    let services = await this.cacheManager.get(cacheKey);

    if (!services) {
      services = await this.servicesRepository.findAll();
      await this.cacheManager.set(cacheKey, services, 300);
    }

    return { services };
  }

  async getServicePackages(serviceId: string) {
    const hasService = await this.servicesRepository.findById(serviceId);
    if (!hasService) {
      throw new HttpException("Service not found", 404);
    }
    return this.servicePackageRepository.findByServiceId(serviceId);
  }

  async getServiceCategories(serviceId: string) {
    return this.categoryRepository.findByServiceId(serviceId);
  }

  async getCategoryItems(categoryId: string) {
    return this.itemsRepository.findByCategory(categoryId);
  }
}
