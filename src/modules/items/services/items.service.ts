import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ItemsRepository } from '../repositories/items.repository';
import { Item, ClothingCategory } from '../schemas/item.schema';
import { GetItemsByCategoryDto, ItemResponseDto } from '../dto/item.dto';

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

  async getItemsByCategory(categoryDto: GetItemsByCategoryDto): Promise<{ items: ItemResponseDto[] }> {
    const cacheKey = `items:category:${categoryDto.category}:${categoryDto.serviceId || 'all'}`;
    let items = await this.cacheManager.get<ItemResponseDto[]>(cacheKey);

    if (!items) {
      // Mock data based on the laundry app interface
      const mockItems = this.getMockItemsByCategory(categoryDto.category);
      items = mockItems.filter(item => 
        !categoryDto.serviceId || item.compatibleServices.includes(categoryDto.serviceId)
      );
      await this.cacheManager.set(cacheKey, items, 300);
    }

    return { items };
  }

  async getItemsByIds(ids: string[]): Promise<Item[]> {
    return this.itemsRepository.findByIds(ids);
  }

  async getAllCategories(): Promise<{ categories: ClothingCategory[] }> {
    return {
      categories: Object.values(ClothingCategory)
    };
  }

  private getMockItemsByCategory(category: ClothingCategory): ItemResponseDto[] {
    const baseItems = {
      [ClothingCategory.TOP]: [
        {
          id: 'shirt-short-sleeve',
          name: 'Shirt (Short Sleeve)',
          category: ClothingCategory.TOP,
          price: 25,
          standardWeight: 1,
          currency: 'GHS',
          icon: '👕',
          careInstructions: ['Machine wash cold', 'Tumble dry low'],
          compatibleServices: ['wash-fold', 'dry-clean'],
          isActive: true,
          description: 'Regular short sleeve shirt'
        },
        {
          id: 'shirt-long-sleeve',
          name: 'Shirt (Long Sleeve)',
          category: ClothingCategory.TOP,
          price: 25,
          standardWeight: 1,
          currency: 'GHS',
          icon: '👔',
          careInstructions: ['Machine wash cold', 'Tumble dry low'],
          compatibleServices: ['wash-fold', 'dry-clean'],
          isActive: true,
          description: 'Regular long sleeve shirt'
        }
      ],
      [ClothingCategory.BOTTOM]: [
        {
          id: 'short',
          name: 'Short',
          category: ClothingCategory.BOTTOM,
          price: 25,
          standardWeight: 1,
          currency: 'GHS',
          icon: '🩳',
          careInstructions: ['Machine wash cold', 'Tumble dry low'],
          compatibleServices: ['wash-fold'],
          isActive: true,
          description: 'Regular shorts'
        },
        {
          id: 'jeans',
          name: 'Jeans',
          category: ClothingCategory.BOTTOM,
          price: 25,
          standardWeight: 1,
          currency: 'GHS',
          icon: '👖',
          careInstructions: ['Machine wash cold', 'Tumble dry low'],
          compatibleServices: ['wash-fold'],
          isActive: true,
          description: 'Denim jeans'
        }
      ],
      [ClothingCategory.OCCASIONAL_WEAR]: [
        {
          id: 'dress-shirt',
          name: 'Dress Shirt',
          category: ClothingCategory.OCCASIONAL_WEAR,
          price: 35,
          standardWeight: 1,
          currency: 'GHS',
          icon: '👔',
          careInstructions: ['Dry clean only'],
          compatibleServices: ['dry-clean'],
          isActive: true,
          description: 'Formal dress shirt'
        }
      ],
      [ClothingCategory.UNDERWEAR]: [
        {
          id: 'underwear',
          name: 'Underwear',
          category: ClothingCategory.UNDERWEAR,
          price: 15,
          standardWeight: 0.2,
          currency: 'GHS',
          icon: '🩲',
          careInstructions: ['Machine wash hot', 'Tumble dry medium'],
          compatibleServices: ['wash-fold'],
          isActive: true,
          description: 'Regular underwear'
        }
      ],
      [ClothingCategory.NIGHTWEAR]: [
        {
          id: 'pajamas',
          name: 'Pajamas',
          category: ClothingCategory.NIGHTWEAR,
          price: 20,
          standardWeight: 0.8,
          currency: 'GHS',
          icon: '🩱',
          careInstructions: ['Machine wash cold', 'Tumble dry low'],
          compatibleServices: ['wash-fold'],
          isActive: true,
          description: 'Comfortable nightwear'
        }
      ],
      [ClothingCategory.ACCESSORIES]: [
        {
          id: 'socks',
          name: 'Socks',
          category: ClothingCategory.ACCESSORIES,
          price: 10,
          standardWeight: 0.1,
          currency: 'GHS',
          icon: '🧦',
          careInstructions: ['Machine wash warm', 'Tumble dry medium'],
          compatibleServices: ['wash-fold'],
          isActive: true,
          description: 'Regular socks'
        }
      ]
    };

    return baseItems[category] || [];
  }
}