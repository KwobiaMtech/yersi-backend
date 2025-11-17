import * as XLSX from 'xlsx';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { VendorsService } from '../modules/vendors/services/vendors.service';
import { LocationService } from '../modules/location/services/location.service';

interface ExcelVendor {
  'Laundry Vendor': string;
  'Address': string;
  'Contact': string | number;
  'Business Hrs'?: string;
  'Ratings': string;
  'Services': string;
  'Remarks'?: string;
}

async function seedVendors() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const vendorsService = app.get(VendorsService);
  const locationService = app.get(LocationService);

  try {
    const excelFilePath = path.join(__dirname, '../../laundry contacts.xlsx');
    const workbook = XLSX.readFile(excelFilePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: ExcelVendor[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Processing ${data.length} vendors from Excel...`);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      if (!row['Laundry Vendor'] || !row['Address']) {
        console.log(`Skipping row ${i + 1}: Missing required data`);
        continue;
      }

      try {
        // Parse rating
        const ratingMatch = row['Ratings']?.toString().match(/(\d+\.?\d*)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 4.0;

        // Parse services
        const services = row['Services']?.split(',').map(s => s.trim()).filter(s => s) || ['Laundry'];

        // Geocode address
        let coordinates = [-0.1870, 5.6037]; // Default Accra coordinates
        try {
          const location = await locationService.geocodeAddress(row['Address']);
          coordinates = [location.longitude, location.latitude];
          console.log(`✓ Geocoded ${row['Laundry Vendor']}: ${coordinates}`);
        } catch (error) {
          console.log(`⚠ Using default coordinates for ${row['Laundry Vendor']}`);
        }

        // Parse address components
        const addressParts = row['Address'].split(',').map(s => s.trim());
        const address = {
          street: addressParts[0] || row['Address'],
          city: addressParts[1] || 'Accra',
          region: addressParts[2] || 'Greater Accra',
        };

        const vendorData = {
          name: row['Laundry Vendor'],
          rating,
          totalReviews: Math.floor(Math.random() * 50) + 10,
          location: {
            type: 'Point',
            coordinates,
          },
          address,
          servicesOffered: services,
          isAvailable: true,
          deliveryFee: Math.floor(Math.random() * 20) + 5,
          estimatedPickupTime: Math.floor(Math.random() * 60) + 30,
          contact: row['Contact']?.toString(),
          businessHours: row['Business Hrs'] || '8:00 AM - 8:00 PM',
        };

        await vendorsService.create(vendorData);
        console.log(`✓ Created vendor: ${row['Laundry Vendor']}`);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`✗ Error creating vendor ${row['Laundry Vendor']}:`, error.message);
      }
    }

    console.log('Vendor seeding completed!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await app.close();
  }
}

seedVendors();
