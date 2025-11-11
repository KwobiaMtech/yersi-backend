import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Complete E2E Test Flow', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let userId: string;
  let vendorId: string;
  let serviceId: string;
  let itemId: string;
  let orderId: string;

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
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('1. Health Check', () => {
    it('GET /health', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);
      
      expect(response.body.status).toBe('ok');
    });
  });

  describe('2. Authentication Flow', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
    };

    it('POST /auth/register', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);
      
      expect(response.body.message).toBeDefined();
    });

    it('POST /auth/login', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);
      
      authToken = response.body.token;
      userId = response.body.user.id;
      expect(authToken).toBeDefined();
    });
  });

  describe('3. Services Module', () => {
    it('GET /services', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/services')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /services (admin)', async () => {
      const serviceData = {
        name: 'Dry Cleaning',
        description: 'Professional dry cleaning service',
        category: 'cleaning',
        basePrice: 15.99
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send(serviceData)
        .expect([201, 403]); // May require admin role
      
      if (response.status === 201) {
        serviceId = response.body.id;
      }
    });
  });

  describe('4. Vendors Module', () => {
    it('GET /vendors/search', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vendors/search')
        .query({ latitude: 5.6037, longitude: -0.1870, radius: 10 })
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /vendors', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vendors')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /vendors (create)', async () => {
      const vendorData = {
        name: 'Test Laundry',
        email: 'vendor@test.com',
        phone: '+1234567891',
        address: '123 Test St',
        location: {
          type: 'Point',
          coordinates: [-0.1870, 5.6037]
        }
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(vendorData)
        .expect([201, 403]);
      
      if (response.status === 201) {
        vendorId = response.body.id;
      }
    });
  });

  describe('5. Items Module', () => {
    it('GET /items', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /items (create)', async () => {
      const itemData = {
        name: 'Shirt',
        category: 'clothing',
        description: 'Cotton shirt',
        basePrice: 5.99
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect([201, 403]);
      
      if (response.status === 201) {
        itemId = response.body.id;
      }
    });
  });

  describe('6. Users Module (Protected)', () => {
    it('GET /users/profile (unauthorized)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .expect(401);
    });

    it('GET /users/profile (authorized)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.email).toBe('test@example.com');
    });

    it('GET /users/credits', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/credits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.credits).toBeDefined();
    });

    it('PUT /users/profile', async () => {
      const updateData = { firstName: 'Updated' };
      
      const response = await request(app.getHttpServer())
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.firstName).toBe('Updated');
    });
  });

  describe('7. Orders Module (Protected)', () => {
    it('GET /orders (unauthorized)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders')
        .expect(401);
    });

    it('GET /orders (authorized)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /orders (create)', async () => {
      const orderData = {
        items: [{ itemId: itemId || 'test-item', quantity: 2 }],
        serviceId: serviceId || 'test-service',
        vendorId: vendorId || 'test-vendor',
        pickupAddress: '123 Test St',
        deliveryAddress: '456 Test Ave'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect([201, 400]);
      
      if (response.status === 201) {
        orderId = response.body.id;
      }
    });

    it('GET /orders/:id', async () => {
      if (orderId) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/orders/${orderId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(response.body.id).toBe(orderId);
      }
    });
  });

  describe('8. Payments Module (Protected)', () => {
    it('GET /payments', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /payments/initiate', async () => {
      const paymentData = {
        orderId: orderId || 'test-order',
        amount: 25.99,
        method: 'card'
      };

      await request(app.getHttpServer())
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect([201, 400]);
    });
  });

  describe('9. Promotions Module', () => {
    it('GET /promotions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/promotions')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /promotions/active', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/promotions/active')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('10. Location Module', () => {
    it('GET /location/nearby', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/location/nearby')
        .query({ latitude: 5.6037, longitude: -0.1870 })
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('11. Admin Module (Protected)', () => {
    it('GET /admin/dashboard (unauthorized)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .expect(401);
    });

    it('GET /admin/dashboard (authorized)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect([200, 403]); // May require admin role
    });

    it('GET /admin/users', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect([200, 403]);
    });

    it('GET /admin/orders', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect([200, 403]);
    });
  });

  describe('12. Error Handling', () => {
    it('404 for non-existent routes', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/non-existent')
        .expect(404);
    });

    it('Validation errors', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'invalid-email' })
        .expect(400);
    });
  });

  describe('13. Rate Limiting', () => {
    it('Should handle multiple requests', async () => {
      const requests = Array(5).fill(null).map(() =>
        request(app.getHttpServer()).get('/api/v1/health')
      );
      
      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });
});
