import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './controllers/location.controller';
import { LocationService } from './services/location.service';
import { VendorsService } from '../vendors/services/vendors.service';

describe('Accra Mall Search Test', () => {
  let controller: LocationController;
  let locationService: LocationService;

  const mockLocationService = {
    autocompleteAddress: jest.fn(),
    geocodeAddress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
        {
          provide: VendorsService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
    locationService = module.get<LocationService>(LocationService);
  });

  it('should search for Accra Mall and display results', async () => {
    // Mock Mapbox-style response for Accra Mall
    const mockResults = {
      predictions: [
        {
          placeId: 'poi.123456789',
          description: 'Accra Mall, Tetteh Quarshie Interchange, Accra, Ghana',
          mainText: 'Accra Mall',
          secondaryText: 'Tetteh Quarshie Interchange, Accra, Ghana',
          coordinates: [-0.1816, 5.6108],
        },
        {
          placeId: 'address.987654321',
          description: 'Accra Mall Road, East Legon, Accra, Ghana',
          mainText: 'Accra Mall Road',
          secondaryText: 'East Legon, Accra, Ghana',
          coordinates: [-0.1820, 5.6105],
        }
      ],
    };

    mockLocationService.autocompleteAddress.mockResolvedValue(mockResults);

    const result = await controller.autocompleteAddress({
      query: 'Accra Mall',
      country: 'GH'
    });

    // Display search results
    console.log('\n=== ACCRA MALL SEARCH RESULTS ===');
    console.log(`Found ${result.predictions.length} results:\n`);
    
    result.predictions.forEach((prediction, index) => {
      console.log(`${index + 1}. ${prediction.description}`);
      console.log(`   Place ID: ${prediction.placeId}`);
      console.log(`   Coordinates: [${prediction.coordinates[1]}, ${prediction.coordinates[0]}] (lat, lng)`);
      console.log(`   Main Text: ${prediction.mainText}`);
      console.log(`   Secondary: ${prediction.secondaryText}\n`);
    });

    expect(result.predictions).toHaveLength(2);
    expect(result.predictions[0].mainText).toBe('Accra Mall');
  });

  it('should geocode Accra Mall address', async () => {
    const mockGeocodeResult = {
      latitude: 5.6108,
      longitude: -0.1816,
      formattedAddress: 'Accra Mall, Tetteh Quarshie Interchange, Accra, Ghana',
      placeId: 'poi.123456789',
    };

    mockLocationService.geocodeAddress.mockResolvedValue(mockGeocodeResult);

    const result = await controller.geocodeAddress({
      address: 'Accra Mall, Accra'
    });

    console.log('\n=== ACCRA MALL GEOCODING RESULT ===');
    console.log(`Address: ${result.formattedAddress}`);
    console.log(`Latitude: ${result.latitude}`);
    console.log(`Longitude: ${result.longitude}`);
    console.log(`Place ID: ${result.placeId}\n`);

    expect(result.latitude).toBe(5.6108);
    expect(result.longitude).toBe(-0.1816);
  });
});
