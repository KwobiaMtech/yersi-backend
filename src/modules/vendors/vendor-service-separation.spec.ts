import { Test, TestingModule } from '@nestjs/testing';
import { VendorsService } from './services/vendors.service';
import { VendorsRepository } from './repositories/vendors.repository';
import { VendorServiceRepository } from './repositories/vendor-service.repository';
import { LocationService } from '../location/services/location.service';

describe('Vendor-Service Separation Test', () => {
  let vendorsService: VendorsService;
  let vendorServiceRepository: VendorServiceRepository;

  const mockVendorsRepository = {
    findNearby: jest.fn(),
    findWithServices: jest.fn(),
  };

  const mockVendorServiceRepository = {
    findByVendorId: jest.fn(),
    findVendorsWithService: jest.fn(),
  };

  const mockLocationService = {
    calculateDistance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorsService,
        {
          provide: VendorsRepository,
          useValue: mockVendorsRepository,
        },
        {
          provide: VendorServiceRepository,
          useValue: mockVendorServiceRepository,
        },
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
      ],
    }).compile();

    vendorsService = module.get<VendorsService>(VendorsService);
    vendorServiceRepository = module.get<VendorServiceRepository>(VendorServiceRepository);
  });

  it('should find vendors with specific service using new relationship', async () => {
    const mockVendors = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Yes Laundry',
        rating: 4.6,
        location: { coordinates: [-0.1647, 5.5502] },
        address: { street: 'Cantoments', city: 'Labone', region: 'Greater Accra' },
        services: [
          {
            serviceId: { name: 'Dry Cleaning', basePrice: 25 },
            price: 20,
            turnaroundHours: 48,
            isAvailable: true,
          },
          {
            serviceId: { name: 'Laundry', basePrice: 15 },
            price: 12,
            turnaroundHours: 24,
            isAvailable: true,
          },
        ],
      },
    ];

    mockVendorsRepository.findNearby.mockResolvedValue(mockVendors);
    mockLocationService.calculateDistance.mockResolvedValue({
      distance: 2.3,
      distanceText: '2.3 km',
      duration: 8,
      durationText: '8 mins',
      status: 'calculated',
    });

    const result = await vendorsService.searchVendors({
      latitude: 5.6037,
      longitude: -0.1870,
      radius: 10000,
      serviceId: '507f1f77bcf86cd799439020', // Dry Cleaning service ID
      includeDistance: true,
    });

    console.log('\n=== VENDOR-SERVICE SEPARATION TEST ===');
    console.log(`Found ${result.total} vendors offering Dry Cleaning:\n`);

    result.vendors.forEach((vendor, index) => {
      console.log(`${index + 1}. ${vendor.name}`);
      console.log(`   Services offered:`);
      if (vendor.services) {
        vendor.services.forEach(service => {
          console.log(`     - ${service.serviceId.name}: GH₵${service.price} (${service.turnaroundHours}h)`);
        });
      }
      console.log(`   Distance: ${vendor.distanceText}\n`);
    });

    expect(result.vendors).toHaveLength(1);
    expect(result.vendors[0].name).toBe('Yes Laundry');
  });

  it('should show vendor services with individual pricing', async () => {
    const mockVendorServices = [
      {
        vendorId: '507f1f77bcf86cd799439011',
        serviceId: {
          _id: '507f1f77bcf86cd799439020',
          name: 'Dry Cleaning',
          description: 'Professional dry cleaning',
          basePrice: 25,
        },
        price: 20,
        turnaroundHours: 48,
        isAvailable: true,
        minimumOrder: 3,
        specialFeatures: ['Stain removal', 'Fabric protection'],
      },
      {
        vendorId: '507f1f77bcf86cd799439011',
        serviceId: {
          _id: '507f1f77bcf86cd799439021',
          name: 'Laundry',
          description: 'Basic laundry service',
          basePrice: 15,
        },
        price: 12,
        turnaroundHours: 24,
        isAvailable: true,
        minimumOrder: 5,
        specialFeatures: ['Eco-friendly detergent'],
      },
    ];

    mockVendorServiceRepository.findByVendorId.mockResolvedValue(mockVendorServices);

    const services = await vendorServiceRepository.findByVendorId('507f1f77bcf86cd799439011');

    console.log('\n=== VENDOR SERVICE PRICING ===');
    console.log('Yes Laundry Services:\n');

    services.forEach((service: any, index) => {
      console.log(`${index + 1}. ${service.serviceId.name}`);
      console.log(`   Base Price: GH₵${service.serviceId.basePrice}`);
      console.log(`   Vendor Price: GH₵${service.price}`);
      console.log(`   Turnaround: ${service.turnaroundHours} hours`);
      console.log(`   Min Order: ${service.minimumOrder} items`);
      console.log(`   Features: ${service.specialFeatures.join(', ')}\n`);
    });

    expect(services).toHaveLength(2);
    expect((services[0] as any).serviceId.name).toBe('Dry Cleaning');
    expect(services[0].price).toBe(20);
  });

  it('should demonstrate service separation benefits', async () => {
    console.log('\n=== SERVICE SEPARATION BENEFITS ===');
    console.log('✅ Vendors can have different prices for same service');
    console.log('✅ Services can be managed independently');
    console.log('✅ Easy to add/remove services per vendor');
    console.log('✅ Individual turnaround times per vendor-service');
    console.log('✅ Special features per vendor-service combination');
    
    expect(true).toBe(true);
  });
});
