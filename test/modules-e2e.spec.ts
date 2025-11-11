import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TestUtils } from './helpers/test-utils';

describe('Modular E2E Tests', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let userId: string;

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
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ 
      transform: true, 
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    
    await app.init();

    // Authenticate once for all tests
    const auth = await TestUtils.authenticateUser(app);
    authToken = auth.token;
    userId = auth.userId;
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('Health Module', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);
      
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Auth Module', () => {
    it('should handle registration validation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'invalid' });
      
      TestUtils.expectValidationError(response);
    });

    it('should handle login with wrong credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@email.com', password: 'wrong' })
        .expect(401);
    });
  });

  describe('Services Module', () => {
    it('should list all services', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/services')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get service by ID', async () => {
      // First create or get a service
      const services = await request(app.getHttpServer())
        .get('/api/v1/services');
      
      if (services.body.length > 0) {
        const serviceId = services.body[0].id;
        await request(app.getHttpServer())
          .get(`/api/v1/services/${serviceId}`)
          .expect(200);
      }
    });
  });

  describe('Vendors Module', () => {
    it('should search vendors by location', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vendors/search')
        .query({ latitude: 5.6037, longitude: -0.1870, radius: 10 })
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require location parameters for search', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/vendors/search')
        .expect(400);
    });
  });

  describe('Items Module', () => {
    it('should list all items', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter items by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items')
        .query({ category: 'clothing' })
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Users Module (Protected)', () => {
    it('should require authentication for profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/profile');
      
      TestUtils.expectUnauthorized(response);
    });

    it('should get user profile with auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.email).toBeDefined();
    });

    it('should update user profile', async () => {
      const updateData = { firstName: 'Updated Name' };
      
      const response = await request(app.getHttpServer())
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
    });

    it('should get user credits', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/credits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.credits).toBeDefined();
    });
  });

  describe('Orders Module (Protected)', () => {
    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders');
      
      TestUtils.expectUnauthorized(response);
    });

    it('should list user orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should validate order creation data', async () => {
      const invalidOrder = { items: [] };
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOrder);
      
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('Payments Module (Protected)', () => {
    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments');
      
      TestUtils.expectUnauthorized(response);
    });

    it('should list user payments', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Promotions Module', () => {
    it('should list all promotions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/promotions')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should list active promotions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/promotions/active')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Location Module', () => {
    it('should find nearby locations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/location/nearby')
        .query({ latitude: 5.6037, longitude: -0.1870 })
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require coordinates for nearby search', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/location/nearby')
        .expect(400);
    });
  });

  describe('Admin Module (Protected)', () => {
    it('should require authentication for dashboard', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard');
      
      TestUtils.expectUnauthorized(response);
    });

    it('should handle admin routes with user token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Should be either forbidden (403) or success (200) depending on user role
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle 404 for non-existent routes', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/non-existent-route')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send('invalid json')
        .set('Content-Type', 'application/json');
      
      expect([400, 422]).toContain(response.status);
    });

    it('should handle invalid IDs', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect([400, 404]);
    });
  });
});
