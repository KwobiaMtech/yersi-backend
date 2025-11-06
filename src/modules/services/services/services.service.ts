import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ServicesRepository } from '../repositories/services.repository';
import { Service } from '../schemas/service.schema';

@Injectable()
export class ServicesService {
  constructor(
    private servicesRepository: ServicesRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getServices(): Promise<{ services: Service[] }> {
    const cacheKey = 'services:all';
    let services = await this.cacheManager.get<Service[]>(cacheKey);

    if (!services) {
      services = await this.servicesRepository.findAll();
      await this.cacheManager.set(cacheKey, services, 300);
    }

    return { services };
  }

  async getServiceById(id: string): Promise<Service | null> {
    const cacheKey = `service:${id}`;
    let service = await this.cacheManager.get<Service>(cacheKey);

    if (!service) {
      service = await this.servicesRepository.findById(id);
      if (service) {
        await this.cacheManager.set(cacheKey, service, 300);
      }
    }

    return service;
  }
}