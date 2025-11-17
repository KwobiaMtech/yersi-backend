import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { VendorsService } from '../modules/vendors/services/vendors.service';

async function testVendors() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const vendorsService = app.get(VendorsService);

  try {
    const result = await vendorsService.searchVendors({
      latitude: 5.6037,
      longitude: -0.1870,
      radius: 50000,
      includeDistance: true,
    });

    console.log(`\n=== VENDOR DATABASE TEST ===`);
    console.log(`Total vendors found: ${result.total}`);
    console.log(`\nFirst 5 vendors:`);
    
    result.vendors.slice(0, 5).forEach((vendor, index) => {
      console.log(`\n${index + 1}. ${vendor.name}`);
      console.log(`   Rating: ${vendor.rating} (${vendor.totalReviews} reviews)`);
      console.log(`   Address: ${vendor.address.street}, ${vendor.address.city}`);
      console.log(`   Services: ${vendor.servicesOffered.join(', ')}`);
      console.log(`   Contact: ${vendor.contact}`);
      console.log(`   Distance: ${vendor.distanceText || 'N/A'}`);
    });

  } catch (error) {
    console.error('Error testing vendors:', error.message);
  } finally {
    await app.close();
  }
}

testVendors();
