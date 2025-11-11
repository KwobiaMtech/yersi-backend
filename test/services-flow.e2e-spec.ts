import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Services Flow (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let serviceId: string;
  let categoryId: string;
  let packageId: string;
  let itemId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('Complete Services Flow', () => {
    it('should create service, package, category, and item, then verify flow', async () => {
      const adminApiKey = 'test-admin-key';
      process.env.ADMIN_API_KEY = adminApiKey;

      // 1. Create a service
      const serviceResponse = await request(app.getHttpServer())
        .post('/admin/services')
        .set('x-admin-api-key', adminApiKey)
        .send({
          name: 'Wash & Fold',
          description: 'Basic washing service',
          basePrice: 15.00,
          minimumOrder: 1,
          turnaroundHours: [24, 48],
          features: ['Washing', 'Folding'],
          icon: 'wash-icon',
          colorTheme: '#4A90E2'
        })
        .expect(201);

      serviceId = serviceResponse.body._id;

      // 2. Create a package for the service
      const packageResponse = await request(app.getHttpServer())
        .post('/admin/services/packages')
        .set('x-admin-api-key', adminApiKey)
        .send({
          name: 'Wash & Fold Package',
          description: 'Complete washing process',
          steps: ['Sorting', 'Washing', 'Folding'],
          serviceId: serviceId
        })
        .expect(201);

      packageId = packageResponse.body._id;

      // 3. Create a category for the service
      const categoryResponse = await request(app.getHttpServer())
        .post('/admin/services/categories')
        .set('x-admin-api-key', adminApiKey)
        .send({
          name: 'Clothing',
          description: 'All clothing items',
          icon: 'clothing-icon',
          colorTheme: '#FF5733',
          serviceId: serviceId
        })
        .expect(201);

      categoryId = categoryResponse.body._id;

      // 4. Create an item for the category
      const itemResponse = await request(app.getHttpServer())
        .post('/admin/items')
        .set('x-admin-api-key', adminApiKey)
        .send({
          name: 'T-Shirt',
          category: 'top',
          categoryId: categoryId,
          price: 5.00,
          standardWeight: 0.2,
          icon: 'tshirt-icon'
        })
        .expect(201);

      itemId = itemResponse.body._id;

      // 5. Test the frontend flow
      
      // Step 1: Load all available services
      const servicesResponse = await request(app.getHttpServer())
        .get('/services')
        .expect(200);

      expect(servicesResponse.body.services).toHaveLength(1);
      expect(servicesResponse.body.services[0].name).toBe('Wash & Fold');

      // Step 2: Load packages linked to service
      const packagesResponse = await request(app.getHttpServer())
        .get(`/services/${serviceId}/packages`)
        .expect(200);

      expect(packagesResponse.body).toHaveLength(1);
      expect(packagesResponse.body[0].name).toBe('Wash & Fold Package');
      expect(packagesResponse.body[0].steps).toEqual(['Sorting', 'Washing', 'Folding']);

      // Step 3: Load categories by service ID
      const categoriesResponse = await request(app.getHttpServer())
        .get(`/services/${serviceId}/categories`)
        .expect(200);

      expect(categoriesResponse.body).toHaveLength(1);
      expect(categoriesResponse.body[0].name).toBe('Clothing');

      // Step 4: Load items when category is clicked
      const itemsResponse = await request(app.getHttpServer())
        .get(`/services/categories/${categoryId}/items`)
        .expect(200);

      expect(itemsResponse.body).toHaveLength(1);
      expect(itemsResponse.body[0].name).toBe('T-Shirt');
      expect(itemsResponse.body[0].price).toBe(5.00);
    });

    it('should return empty arrays for non-existent relationships', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      // Test empty packages for non-existent service
      await request(app.getHttpServer())
        .get(`/services/${fakeId}/packages`)
        .expect(200)
        .expect([]);

      // Test empty categories for non-existent service
      await request(app.getHttpServer())
        .get(`/services/${fakeId}/categories`)
        .expect(200)
        .expect([]);

      // Test empty items for non-existent category
      await request(app.getHttpServer())
        .get(`/services/categories/${fakeId}/items`)
        .expect(200)
        .expect([]);
    });
  });
});
