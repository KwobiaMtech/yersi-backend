import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ItemsRepository } from '../repositories/items.repository';
import { Item } from '../schemas/item.schema';

@Injectable()
export class ItemsService {
  constructor(
    private itemsRepository: ItemsRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getItemsByService(serviceId: string): Promise<{ items: Item[] }> {
    const cacheKey = `items:service:${serviceId}`;
    let items = await this.cacheManager.get<Item[]>(cacheKey);

    if (!items) {
      items = await this.itemsRepository.findByService(serviceId);
      await this.cacheManager.set(cacheKey, items, 300);
    }

    return { items };
  }

  async getItemsByIds(ids: string[]): Promise<Item[]> {
    return this.itemsRepository.findByIds(ids);
  }
}