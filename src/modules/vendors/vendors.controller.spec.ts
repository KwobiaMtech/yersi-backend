import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { VendorsController } from './controllers/vendors.controller';
import { VendorsService } from './services/vendors.service';

describe('VendorsController', () => {
  let controller: VendorsController;
  let service: VendorsService;

  const mockVendorsService = {
    searchVendors: jest.fn(),
    getVendorById: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorsController],
      providers: [
        {
          provide: VendorsService,
          useValue: mockVendorsService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<VendorsController>(VendorsController);
    service = module.get<VendorsService>(VendorsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchVendors', () => {
    it('should search vendors with coordinates', async () => {
      const query = { 
        latitude: 5.6037, 
        longitude: -0.1870, 
        radius: 10,
        serviceId: 'service123',
        includeDistance: true,
        sortBy: 'distance'
      };
      
      const result = {
        vendors: [
          { 
            id: '1', 
            name: 'Clean Express', 
            distance: 2.3,
            distanceText: '2.3 km'
          }
        ],
        total: 1,
        userLocation: { latitude: 5.6037, longitude: -0.1870 },
        searchCriteria: query
      };

      mockVendorsService.searchVendors.mockResolvedValue(result);

      expect(await controller.searchVendors(query)).toBe(result);
      expect(service.searchVendors).toHaveBeenCalledWith(query);
    });

    it('should search vendors with address', async () => {
      const query = { 
        address: 'Oxford Street, Accra',
        radius: 15,
        includeDistance: false
      };
      
      const result = {
        vendors: [{ id: '1', name: 'Clean Express' }],
        total: 1,
        searchCriteria: query
      };

      mockVendorsService.searchVendors.mockResolvedValue(result);

      expect(await controller.searchVendors(query)).toBe(result);
      expect(service.searchVendors).toHaveBeenCalledWith(query);
    });

    it('should search vendors with place ID', async () => {
      const query = { 
        placeId: 'ChIJ123',
        serviceId: 'service123'
      };
      
      const result = {
        vendors: [{ id: '1', name: 'Clean Express' }],
        total: 1,
        searchCriteria: query
      };

      mockVendorsService.searchVendors.mockResolvedValue(result);

      expect(await controller.searchVendors(query)).toBe(result);
      expect(service.searchVendors).toHaveBeenCalledWith(query);
    });
  });

  describe('getVendor', () => {
    it('should return vendor by id', async () => {
      const vendorId = '507f1f77bcf86cd799439011';
      const result = { id: vendorId, name: 'Clean Express' };

      mockVendorsService.getVendorById.mockResolvedValue(result);

      expect(await controller.getVendor(vendorId)).toBe(result);
      expect(service.getVendorById).toHaveBeenCalledWith(vendorId);
    });
  });
});
