import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocationController } from './controllers/location.controller';
import { LocationService } from './services/location.service';
import { GoogleMapsProvider } from './providers/google-maps.provider';
import { MapboxProvider } from './providers/mapbox.provider';
import { NominatimProvider } from './providers/nominatim.provider';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [ConfigModule, forwardRef(() => VendorsModule)],
  controllers: [LocationController],
  providers: [
    LocationService,
    GoogleMapsProvider,
    MapboxProvider,
    NominatimProvider,
  ],
  exports: [LocationService],
})
export class LocationModule {}
