import { Test, TestingModule } from '@nestjs/testing';
import { AdminItemsController } from '../src/modules/admin/controllers/admin-items.controller';
import { AdminItemsService } from '../src/modules/admin/services/admin-items.service';
import { AdminApiKeyGuard } from '../src/modules/admin/guards/admin-api-key.guard';
import { ClothingCategory } from '../src/modules/items/schemas/item.schema';

describe('AdminItemsController', () => {
  let controller: AdminItemsController;
  let service: jest.Mocked<AdminItemsService>;

  beforeEach(async () => {
    const mockService = {
      createItem: jest.fn(),
      getItemsByCategory: jest.fn(),
    };

    const mockGuard = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminItemsController],
      providers: [{ provide: AdminItemsService, useValue: mockService }],
    })
      .overrideGuard(AdminApiKeyGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<AdminItemsController>(AdminItemsController);
    service = module.get(AdminItemsService);
  });

  describe('createItem', () => {
    it('should delegate to service', async () => {
      const mockItemData = {
        name: 'Test Item',
        category: ClothingCategory.TOP,
        categoryId: '507f1f77bcf86cd799439011',
        price: 100,
        icon: 'test-icon',
      };
      const mockResult = { ...mockItemData, _id: 'created-id' } as any;

      service.createItem.mockResolvedValue(mockResult);

      const result = await controller.createItem(mockItemData);

      expect(service.createItem).toHaveBeenCalledWith(mockItemData);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getItemsByCategory', () => {
    it('should delegate to service', async () => {
      const categoryId = '507f1f77bcf86cd799439011';
      const mockItems = [{ _id: 'item1', name: 'Item 1' }] as any;

      service.getItemsByCategory.mockResolvedValue(mockItems);

      const result = await controller.getItemsByCategory(categoryId);

      expect(service.getItemsByCategory).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(mockItems);
    });
  });
});
