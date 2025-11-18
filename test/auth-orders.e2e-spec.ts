import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('Auth & Orders E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create valid JWT token for testing', async () => {
    const payload = {
      sub: '507f1f77bcf86cd799439011',
      email: 'test@example.com'
    };
    
    authToken = jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key'
    });
    
    expect(authToken).toBeDefined();
  });

  it('should fail to access orders without token', async () => {
    await request(app.getHttpServer())
      .get('/orders')
      .expect(401);
  });

  it('should access orders with valid token', async () => {
    await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });

  it('should create order with valid token', async () => {
    const orderDto = {
      serviceId: '507f1f77bcf86cd799439011',
      items: [{
        itemId: '507f1f77bcf86cd799439014',
        name: 'T-Shirt',
        category: 'top',
        categoryId: '507f1f77bcf86cd799439013',
        quantity: 1,
        weight: 0.2
      }],
      pickupAddress: {
        street: 'Test Street',
        city: 'Accra',
        region: 'Greater Accra',
        phone: '+233123456789',
        latitude: 5.6037,
        longitude: -0.1870
      },
      deliveryAddress: {
        street: 'Test Delivery',
        city: 'Accra',
        region: 'Greater Accra',
        phone: '+233987654321',
        latitude: 5.5600,
        longitude: -0.2057
      }
    };

    await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(orderDto)
      .expect(201);
  });
});
