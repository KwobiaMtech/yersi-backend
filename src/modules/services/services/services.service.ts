import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ServicesRepository } from '../repositories/services.repository';

@Injectable()
export class ServicesService {
  constructor(
    private servicesRepository: ServicesRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getServices() {
    const cacheKey = 'services:all';
    let services = await this.cacheManager.get(cacheKey);

    if (!services) {
      services = await this.servicesRepository.findAll();
      await this.cacheManager.set(cacheKey, services, 300);
    }

    return { services };
  }
}