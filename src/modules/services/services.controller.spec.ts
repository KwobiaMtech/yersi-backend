import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ServicesController } from './controllers/services.controller';
import { ServicesService } from './services/services.service';

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: ServicesService;

  const mockServicesService = {
    getServices: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    service = module.get<ServicesService>(ServicesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getServices', () => {
    it('should return an array of services', async () => {
      const result = [
        { id: '1', name: 'Wash & Fold', description: 'Basic washing service' },
        { id: '2', name: 'Dry Cleaning', description: 'Professional dry cleaning' },
      ];

      mockServicesService.getServices.mockResolvedValue(result);

      expect(await controller.getServices()).toBe(result);
      expect(service.getServices).toHaveBeenCalled();
    });
  });
});
