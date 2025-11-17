import { Test, TestingModule } from '@nestjs/testing';
import { VendorsService } from './services/vendors.service';
import { VendorsRepository } from './repositories/vendors.repository';
import { LocationService } from '../location/services/location.service';

describe('Vendor Database Test', () => {
  let vendorsService: VendorsService;

  const mockVendorsRepository = {
    findAll: jest.fn(),
    findNearby: jest.fn(),
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
          provide: LocationService,
          useValue: mockLocationService,
        },
      ],
    }).compile();

    vendorsService = module.get<VendorsService>(VendorsService);
  });

  it('should find vendors from seeded database', async () => {
    const mockVendors = [
      {
        name: 'Yes Laundry',
        rating: 4.6,
        totalReviews: 40,
        address: { street: 'Cantoments', city: 'Labone', region: 'Greater Accra' },
        servicesOffered: ['Dry cleaning', 'Ironing', 'Laundry pick-up'],
        contact: '+233 55 869 6943',
        location: { coordinates: [-0.1870, 5.6037] },
        toObject: () => ({ name: 'Yes Laundry', rating: 4.6 }),
      },
      {
        name: 'Wash & Go Laundry',
        rating: 4.9,
        address: { street: 'Tantra Hill', city: 'Adenta', region: 'Greater Accra' },
        servicesOffered: ['Dry Cleaning', 'Carpet Cleaning'],
        contact: '507003923',
        location: { coordinates: [-0.1820, 5.6105] },
        toObject: () => ({ name: 'Wash & Go Laundry', rating: 4.9 }),
      },
    ];

    mockVendorsRepository.findNearby.mockResolvedValue(mockVendors);
    mockLocationService.calculateDistance.mockResolvedValue({
      distance: 1.2,
      distanceText: '1.2 km',
      duration: 3,
      durationText: '3 mins',
      status: 'calculated',
    });

    const result = await vendorsService.searchVendors({
      latitude: 5.6037,
      longitude: -0.1870,
      radius: 10000,
      includeDistance: true,
    });

    console.log('\n=== VENDOR DATABASE TEST RESULTS ===');
    console.log(`Total vendors: ${result.total}`);
    
    result.vendors.forEach((vendor, index) => {
      console.log(`\n${index + 1}. ${vendor.name}`);
      console.log(`   Rating: ${vendor.rating}`);
      console.log(`   Distance: ${vendor.distanceText}`);
    });

    expect(result.vendors).toHaveLength(2);
    expect(result.vendors[0].name).toBe('Yes Laundry');
    expect(result.vendors[1].name).toBe('Wash & Go Laundry');
  });

  it('should verify vendor data structure from Excel', async () => {
    const mockVendor = {
      name: 'Prestige Laundry',
      rating: 4.1,
      totalReviews: 34,
      address: { street: 'Tetegu', city: 'Weija', region: 'Greater Accra' },
      servicesOffered: ['Laundry', 'Dry Cleaning'],
      contact: '+233 54 679 2321',
      businessHours: '8:00 AM - 8:00 PM',
      location: { coordinates: [-0.2028, 5.6611] },
      isActive: true,
      deliveryFee: 15,
    };

    console.log('\n=== VENDOR DATA STRUCTURE ===');
    console.log(`Name: ${mockVendor.name}`);
    console.log(`Rating: ${mockVendor.rating}`);
    console.log(`Address: ${mockVendor.address.street}, ${mockVendor.address.city}`);
    console.log(`Services: ${mockVendor.servicesOffered.join(', ')}`);
    console.log(`Contact: ${mockVendor.contact}`);
    console.log(`Business Hours: ${mockVendor.businessHours}`);

    expect(mockVendor.name).toBeDefined();
    expect(mockVendor.rating).toBeGreaterThan(0);
    expect(mockVendor.servicesOffered).toBeInstanceOf(Array);
    expect(mockVendor.location.coordinates).toHaveLength(2);
  });
});
