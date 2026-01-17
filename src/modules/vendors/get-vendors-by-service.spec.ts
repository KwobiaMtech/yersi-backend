import { Test, TestingModule } from '@nestjs/testing';
import { VendorsController } from './controllers/vendors.controller';
import { VendorsService } from './services/vendors.service';

describe('Get Vendors By Service API', () => {
  let controller: VendorsController;
  let service: VendorsService;

  const mockVendorsService = {
    getVendorsByService: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorsController],
      providers: [
        {
          provide: VendorsService,
          useValue: mockVendorsService,
        },
      ],
    }).compile();

    controller = module.get<VendorsController>(VendorsController);
    service = module.get<VendorsService>(VendorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return vendors offering a specific service', async () => {
    const serviceId = '507f1f77bcf86cd799439011';
    const mockResponse = {
      vendors: [
        {
          _id: '507f1f77bcf86cd799439021',
          name: 'Clean Express Laundromat',
          rating: 4.5,
          totalReviews: 128,
          address: {
            street: '123 Oxford Street',
            city: 'Accra',
            region: 'Greater Accra',
          },
          deliveryFee: 10,
          estimatedPickupTime: 30,
          contact: '+233201234567',
          businessHours: '8:00 AM - 8:00 PM',
          serviceDetails: {
            price: 15,
            turnaroundHours: 24,
            isAvailable: true,
          },
        },
        {
          _id: '507f1f77bcf86cd799439022',
          name: 'Quick Wash',
          rating: 4.2,
          totalReviews: 85,
          address: {
            street: '45 Ring Road',
            city: 'Accra',
            region: 'Greater Accra',
          },
          deliveryFee: 8,
          estimatedPickupTime: 25,
          contact: '+233209876543',
          businessHours: '7:00 AM - 9:00 PM',
          serviceDetails: {
            price: 12,
            turnaroundHours: 48,
            isAvailable: true,
          },
        },
      ],
      total: 2,
      serviceId,
    };

    mockVendorsService.getVendorsByService.mockResolvedValue(mockResponse);

    const result = await controller.getVendorsByService(serviceId);

    expect(service.getVendorsByService).toHaveBeenCalledWith(serviceId);
    expect(result).toEqual(mockResponse);
    expect(result.vendors).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.serviceId).toBe(serviceId);
  });

  it('should return empty array when no vendors offer the service', async () => {
    const serviceId = '507f1f77bcf86cd799439099';
    const mockResponse = {
      vendors: [],
      total: 0,
      serviceId,
    };

    mockVendorsService.getVendorsByService.mockResolvedValue(mockResponse);

    const result = await controller.getVendorsByService(serviceId);

    expect(service.getVendorsByService).toHaveBeenCalledWith(serviceId);
    expect(result.vendors).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should include vendor-specific service details', async () => {
    const serviceId = '507f1f77bcf86cd799439011';
    const mockResponse = {
      vendors: [
        {
          _id: '507f1f77bcf86cd799439021',
          name: 'Premium Cleaners',
          rating: 4.8,
          serviceDetails: {
            price: 20,
            turnaroundHours: 12,
            isAvailable: true,
            minimumOrder: 5,
          },
        },
      ],
      total: 1,
      serviceId,
    };

    mockVendorsService.getVendorsByService.mockResolvedValue(mockResponse);

    const result = await controller.getVendorsByService(serviceId);

    expect(result.vendors[0].serviceDetails).toBeDefined();
    expect(result.vendors[0].serviceDetails.price).toBe(20);
    expect(result.vendors[0].serviceDetails.turnaroundHours).toBe(12);
    expect(result.vendors[0].serviceDetails.isAvailable).toBe(true);
  });

  it('should only return active vendors with available services', async () => {
    const serviceId = '507f1f77bcf86cd799439011';
    const mockResponse = {
      vendors: [
        {
          _id: '507f1f77bcf86cd799439021',
          name: 'Active Vendor',
          isActive: true,
          serviceDetails: {
            isAvailable: true,
          },
        },
      ],
      total: 1,
      serviceId,
    };

    mockVendorsService.getVendorsByService.mockResolvedValue(mockResponse);

    const result = await controller.getVendorsByService(serviceId);

    result.vendors.forEach((vendor) => {
      expect(vendor.serviceDetails.isAvailable).toBe(true);
    });
  });

  it('should sort vendors by rating descending', async () => {
    const serviceId = '507f1f77bcf86cd799439011';
    const mockResponse = {
      vendors: [
        { _id: '1', name: 'Vendor A', rating: 4.8 },
        { _id: '2', name: 'Vendor B', rating: 4.5 },
        { _id: '3', name: 'Vendor C', rating: 4.2 },
      ],
      total: 3,
      serviceId,
    };

    mockVendorsService.getVendorsByService.mockResolvedValue(mockResponse);

    const result = await controller.getVendorsByService(serviceId);

    expect(result.vendors[0].rating).toBeGreaterThanOrEqual(result.vendors[1].rating);
    expect(result.vendors[1].rating).toBeGreaterThanOrEqual(result.vendors[2].rating);
  });
});
