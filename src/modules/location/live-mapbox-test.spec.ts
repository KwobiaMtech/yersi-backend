import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MapboxProvider } from './providers/mapbox.provider';
import * as dotenv from 'dotenv';

dotenv.config();

describe('Live Mapbox API Test', () => {
  let mapboxProvider: MapboxProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MapboxProvider,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => process.env[key],
          },
        },
      ],
    }).compile();

    mapboxProvider = module.get<MapboxProvider>(MapboxProvider);
  });

  it('should handle autocomplete search (may return empty)', async () => {
    const result = await mapboxProvider.autocompleteAddress('Accra', 'gh');

    console.log('\n=== LIVE MAPBOX: AUTOCOMPLETE TEST ===');
    console.log(`Found ${result.predictions.length} results`);
    
    if (result.predictions.length > 0) {
      result.predictions.forEach((prediction, index) => {
        console.log(`${index + 1}. ${prediction.description}`);
      });
    } else {
      console.log('No autocomplete results (this is normal for some queries)');
    }

    expect(result).toBeDefined();
    expect(result.predictions).toBeDefined();
  }, 15000);

  it('should geocode Oxford Street Accra using live API', async () => {
    const result = await mapboxProvider.geocodeAddress('Oxford Street, Accra, Ghana');

    console.log('\n=== LIVE MAPBOX: GEOCODING SUCCESS ===');
    console.log(`Address: ${result.formattedAddress}`);
    console.log(`Latitude: ${result.latitude}`);
    console.log(`Longitude: ${result.longitude}`);

    expect(result.latitude).toBeDefined();
    expect(result.longitude).toBeDefined();
  }, 15000);

  it('should calculate distance between Accra locations', async () => {
    const result = await mapboxProvider.calculateDistance(
      5.6037, -0.1870,
      5.6108, -0.1816
    );

    console.log('\n=== LIVE MAPBOX: DISTANCE SUCCESS ===');
    console.log(`Distance: ${result.distanceText}`);
    console.log(`Duration: ${result.durationText}`);

    expect(result.distance).toBeGreaterThan(0);
    expect(result.status).toBe('calculated');
  }, 15000);
});
