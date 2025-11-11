import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Admin Services E2E', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  const adminApiKey = 'test-admin-key-123';

  beforeAll(async () => {
    // Set environment variable for test
    process.env.ADMIN_API_KEY = adminApiKey;
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ 
      transform: true, 
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
    delete process.env.ADMIN_API_KEY;
  });

  describe('Admin Services API', () => {
    let serviceId: string;

    it('should create a service', async () => {
      const serviceData = {
        name: 'Test Dry Cleaning',
        description: 'Professional dry cleaning service',
        basePrice: 25.99,
        minimumOrder: 1,
        turnaroundHours: [24, 48],
        features: ['Eco-friendly', 'Same-day service'],
        icon: 'dry-clean-icon',
        colorTheme: '#3498db'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/services')
        .set('x-admin-api-key', adminApiKey)
        .send(serviceData)
        .expect(201);

      expect(response.body.name).toBe(serviceData.name);
      expect(response.body.basePrice).toBe(serviceData.basePrice);
      serviceId = response.body.id;
    });

    it('should get all services', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/services')
        .set('x-admin-api-key', adminApiKey)
        .expect(200);

      expect(response.body.services).toBeDefined();
      expect(Array.isArray(response.body.services)).toBe(true);
      expect(response.body.services.length).toBeGreaterThan(0);

      const service = response.body.services[0];
      expect(service).toHaveProperty('id');
      expect(service).toHaveProperty('name');
      expect(service).toHaveProperty('description');
      expect(service).toHaveProperty('basePrice');
      expect(service).toHaveProperty('currency');
      expect(service).toHaveProperty('minimumOrder');
      expect(service).toHaveProperty('turnaroundHours');
      expect(service).toHaveProperty('features');
      expect(service).toHaveProperty('icon');
      expect(service).toHaveProperty('colorTheme');
      expect(service).toHaveProperty('isActive');
    });

    it('should require admin API key', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/services')
        .expect(401);
    });

    it('should reject invalid API key', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/services')
        .set('x-admin-api-key', 'invalid-key')
        .expect(401);
    });
  });
});
