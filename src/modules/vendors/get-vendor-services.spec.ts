import { Test, TestingModule } from '@nestjs/testing';
import { VendorsController } from './controllers/vendors.controller';
import { VendorsService } from './services/vendors.service';

describe('Get Vendor Services API', () => {
  let controller: VendorsController;
  let service: VendorsService;

  const mockVendorsService = {
    getVendorServices: jest.fn(),
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

  it('should return all services offered by a vendor', async () => {
    const vendorId = '507f1f77bcf86cd799439021';
    const mockResponse = {
      vendorId,
      services: [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Laundry',
          description: 'Basic laundry service',
          icon: 'wash',
          colorTheme: '#4CAF50',
          basePrice: 15,
          vendorPrice: 12,
          turnaroundHours: 24,
          minimumOrder: 5,
          specialFeatures: ['Express delivery', 'Eco-friendly'],
          isAvailable: true,
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Dry Cleaning',
          description: 'Professional dry cleaning',
          icon: 'dry-clean',
          colorTheme: '#2196F3',
          basePrice: 25,
          vendorPrice: 22,
          turnaroundHours: 48,
          minimumOrder: 3,
          specialFeatures: [],
          isAvailable: true,
        },
      ],
      total: 2,
    };

    mockVendorsService.getVendorServices.mockResolvedValue(mockResponse);

    const result = await controller.getVendorServices(vendorId);

    expect(service.getVendorServices).toHaveBeenCalledWith(vendorId);
    expect(result).toEqual(mockResponse);
    expect(result.services).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.vendorId).toBe(vendorId);
  });

  it('should include vendor-specific pricing for each service', async () => {
    const vendorId = '507f1f77bcf86cd799439021';
    const mockResponse = {
      vendorId,
      services: [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Laundry',
          basePrice: 15,
          vendorPrice: 12,
          turnaroundHours: 24,
          minimumOrder: 5,
          isAvailable: true,
        },
      ],
      total: 1,
    };

    mockVendorsService.getVendorServices.mockResolvedValue(mockResponse);

    const result = await controller.getVendorServices(vendorId);

    expect(result.services[0].basePrice).toBe(15);
    expect(result.services[0].vendorPrice).toBe(12);
    expect(result.services[0].turnaroundHours).toBe(24);
    expect(result.services[0].minimumOrder).toBe(5);
  });

  it('should return empty array when vendor offers no services', async () => {
    const vendorId = '507f1f77bcf86cd799439099';
    const mockResponse = {
      vendorId,
      services: [],
      total: 0,
    };

    mockVendorsService.getVendorServices.mockResolvedValue(mockResponse);

    const result = await controller.getVendorServices(vendorId);

    expect(service.getVendorServices).toHaveBeenCalledWith(vendorId);
    expect(result.services).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should only return available services', async () => {
    const vendorId = '507f1f77bcf86cd799439021';
    const mockResponse = {
      vendorId,
      services: [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Laundry',
          isAvailable: true,
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Ironing',
          isAvailable: true,
        },
      ],
      total: 2,
    };

    mockVendorsService.getVendorServices.mockResolvedValue(mockResponse);

    const result = await controller.getVendorServices(vendorId);

    result.services.forEach((service) => {
      expect(service.isAvailable).toBe(true);
    });
  });

  it('should include special features for services', async () => {
    const vendorId = '507f1f77bcf86cd799439021';
    const mockResponse = {
      vendorId,
      services: [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Premium Laundry',
          specialFeatures: ['Express delivery', 'Eco-friendly', '24/7 pickup'],
          isAvailable: true,
        },
      ],
      total: 1,
    };

    mockVendorsService.getVendorServices.mockResolvedValue(mockResponse);

    const result = await controller.getVendorServices(vendorId);

    expect(result.services[0].specialFeatures).toBeDefined();
    expect(result.services[0].specialFeatures).toHaveLength(3);
    expect(result.services[0].specialFeatures).toContain('Express delivery');
  });

  it('should sort services alphabetically by name', async () => {
    const vendorId = '507f1f77bcf86cd799439021';
    const mockResponse = {
      vendorId,
      services: [
        { _id: '1', name: 'Carpet Cleaning' },
        { _id: '2', name: 'Dry Cleaning' },
        { _id: '3', name: 'Laundry' },
      ],
      total: 3,
    };

    mockVendorsService.getVendorServices.mockResolvedValue(mockResponse);

    const result = await controller.getVendorServices(vendorId);

    expect(result.services[0].name).toBe('Carpet Cleaning');
    expect(result.services[1].name).toBe('Dry Cleaning');
    expect(result.services[2].name).toBe('Laundry');
  });
});
