import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AdminItemsService } from '../src/modules/admin/services/admin-items.service';
import { ItemsRepository } from '../src/modules/items/repositories/items.repository';
import { CategoryRepository } from '../src/modules/services/repositories/category.repository';
import { ClothingCategory } from '../src/modules/items/schemas/item.schema';

describe('AdminItemsService', () => {
  let service: AdminItemsService;
  let itemsRepository: jest.Mocked<ItemsRepository>;
  let categoryRepository: jest.Mocked<CategoryRepository>;

  beforeEach(async () => {
    const mockItemsRepository = {
      create: jest.fn(),
      findByCategory: jest.fn(),
    };

    const mockCategoryRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminItemsService,
        { provide: ItemsRepository, useValue: mockItemsRepository },
        { provide: CategoryRepository, useValue: mockCategoryRepository },
      ],
    }).compile();

    service = module.get<AdminItemsService>(AdminItemsService);
    itemsRepository = module.get(ItemsRepository);
    categoryRepository = module.get(CategoryRepository);
  });

  describe('createItem', () => {
    const mockItemData = {
      name: 'Test Item',
      category: ClothingCategory.TOP,
      categoryId: '507f1f77bcf86cd799439011',
      price: 100,
      icon: 'test-icon',
    };

    it('should create item when category exists', async () => {
      const mockCategory = { id: '507f1f77bcf86cd799439011', name: 'Test Category' } as any;
      const mockCreatedItem = { ...mockItemData, _id: new Types.ObjectId() } as any;

      categoryRepository.findById.mockResolvedValue(mockCategory);
      itemsRepository.create.mockResolvedValue(mockCreatedItem);

      const result = await service.createItem(mockItemData);

      expect(categoryRepository.findById).toHaveBeenCalledWith(mockItemData.categoryId);
      expect(itemsRepository.create).toHaveBeenCalledWith({
        ...mockItemData,
        categoryId: new Types.ObjectId(mockItemData.categoryId),
      });
      expect(result).toEqual(mockCreatedItem);
    });

    it('should throw BadRequestException when category does not exist', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(service.createItem(mockItemData)).rejects.toThrow(BadRequestException);
      expect(itemsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getItemsByCategory', () => {
    it('should return items by category', async () => {
      const categoryId = '507f1f77bcf86cd799439011';
      const mockItems = [
        { _id: new Types.ObjectId(), name: 'Item 1', categoryId },
        { _id: new Types.ObjectId(), name: 'Item 2', categoryId },
      ] as any;

      itemsRepository.findByCategory.mockResolvedValue(mockItems);

      const result = await service.getItemsByCategory(categoryId);

      expect(itemsRepository.findByCategory).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(mockItems);
    });
  });
});
