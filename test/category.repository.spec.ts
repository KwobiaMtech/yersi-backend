import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CategoryRepository } from '../src/modules/services/repositories/category.repository';
import { Category } from '../src/modules/services/schemas/category.schema';
import { Service } from '../src/modules/services/schemas/service.schema';

describe('CategoryRepository', () => {
  let repository: CategoryRepository;
  let categoryModel: any;

  beforeEach(async () => {
    const mockCategoryModel = {
      findOne: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const mockServiceModel = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryRepository,
        { provide: getModelToken(Category.name), useValue: mockCategoryModel },
        { provide: getModelToken(Service.name), useValue: mockServiceModel },
      ],
    }).compile();

    repository = module.get<CategoryRepository>(CategoryRepository);
    categoryModel = module.get(getModelToken(Category.name));
  });

  describe('findById', () => {
    it('should find category by ObjectId', async () => {
      const categoryId = '507f1f77bcf86cd799439011';
      const mockCategory = { _id: new Types.ObjectId(categoryId), name: 'Test Category' };

      categoryModel.exec.mockResolvedValue(mockCategory);

      const result = await repository.findById(categoryId);

      expect(categoryModel.findOne).toHaveBeenCalledWith({
        $or: [
          { _id: new Types.ObjectId(categoryId) },
          { id: categoryId }
        ],
        isActive: true
      });
      expect(result).toEqual(mockCategory);
    });

    it('should return null when category not found', async () => {
      const categoryId = '507f1f77bcf86cd799439011';

      categoryModel.exec.mockResolvedValue(null);

      const result = await repository.findById(categoryId);

      expect(result).toBeNull();
    });

    it('should find category by string id', async () => {
      const categoryId = 'string-category-id';
      const mockCategory = { id: categoryId, name: 'Test Category' };

      categoryModel.exec.mockResolvedValue(mockCategory);

      const result = await repository.findById(categoryId);

      expect(categoryModel.findOne).toHaveBeenCalledWith({
        id: categoryId,
        isActive: true
      });
      expect(result).toEqual(mockCategory);
    });
  });
});
