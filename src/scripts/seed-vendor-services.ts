import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { VendorsRepository } from '../modules/vendors/repositories/vendors.repository';
import { VendorServiceRepository } from '../modules/vendors/repositories/vendor-service.repository';
import { getModelToken } from '@nestjs/mongoose';
import { Service } from '../modules/services/schemas/service.schema';

async function seedVendorServices() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const vendorsRepository = app.get(VendorsRepository);
  const vendorServiceRepository = app.get(VendorServiceRepository);
  const serviceModel = app.get(getModelToken(Service.name));

  try {
    // Create basic services if they don't exist
    const services = [
      { name: 'Laundry', description: 'Basic laundry service', basePrice: 15, minimumOrder: 5, turnaroundHours: [24, 48], icon: 'wash', colorTheme: '#4CAF50' },
      { name: 'Dry Cleaning', description: 'Professional dry cleaning', basePrice: 25, minimumOrder: 3, turnaroundHours: [48, 72], icon: 'dry-clean', colorTheme: '#2196F3' },
      { name: 'Ironing', description: 'Professional ironing service', basePrice: 10, minimumOrder: 5, turnaroundHours: [12, 24], icon: 'iron', colorTheme: '#FF9800' },
      { name: 'Carpet Cleaning', description: 'Deep carpet cleaning', basePrice: 50, minimumOrder: 1, turnaroundHours: [24, 48], icon: 'carpet', colorTheme: '#9C27B0' },
      { name: 'Laundry pick-up', description: 'Pick-up and delivery service', basePrice: 5, minimumOrder: 10, turnaroundHours: [2, 4], icon: 'pickup', colorTheme: '#607D8B' },
    ];

    const createdServices = {};
    for (const service of services) {
      let existingService = await serviceModel.findOne({ name: service.name });
      if (!existingService) {
        existingService = await serviceModel.create(service);
      }
      createdServices[service.name] = existingService._id;
    }

    // Get all vendors with their old servicesOffered array
    const vendors = await vendorsRepository.findAll();
    console.log(`Processing ${vendors.length} vendors...`);

    for (const vendor of vendors) {
      const servicesOffered = vendor.servicesOffered || [];
      
      for (const serviceName of servicesOffered) {
        const cleanServiceName = serviceName.trim();
        let serviceId = null;

        // Map service names to IDs
        if (cleanServiceName.toLowerCase().includes('dry clean')) {
          serviceId = createdServices['Dry Cleaning'];
        } else if (cleanServiceName.toLowerCase().includes('iron')) {
          serviceId = createdServices['Ironing'];
        } else if (cleanServiceName.toLowerCase().includes('carpet')) {
          serviceId = createdServices['Carpet Cleaning'];
        } else if (cleanServiceName.toLowerCase().includes('pick-up') || cleanServiceName.toLowerCase().includes('pickup')) {
          serviceId = createdServices['Laundry pick-up'];
        } else if (cleanServiceName.toLowerCase().includes('laundry') || cleanServiceName.toLowerCase().includes('wash')) {
          serviceId = createdServices['Laundry'];
        }

        if (serviceId) {
          try {
            await vendorServiceRepository.create({
              vendorId: vendor._id,
              serviceId,
              price: Math.floor(Math.random() * 20) + 10, // Random price 10-30
              turnaroundHours: [24, 48][Math.floor(Math.random() * 2)],
              isAvailable: true,
              minimumOrder: Math.floor(Math.random() * 5) + 1,
            });
            console.log(`✓ Linked ${vendor.name} to ${cleanServiceName}`);
          } catch (error) {
            if (!error.message.includes('duplicate')) {
              console.log(`⚠ Error linking ${vendor.name} to ${cleanServiceName}:`, error.message);
            }
          }
        }
      }
    }

    console.log('Vendor-Service seeding completed!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await app.close();
  }
}

seedVendorServices();
