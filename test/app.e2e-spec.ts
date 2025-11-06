import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Laundry Service API (e2e)', () => {
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
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('Health Check', () => {
    it('/api/v1/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('database');
          expect(res.body).toHaveProperty('memory');
        });
    });
  });

  describe('Authentication', () => {
    const userDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
    };

    it('/api/v1/auth/register (POST)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(userDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          expect(res.body.user.email).toBe(userDto.email);
          userId = res.body.user.id;
        });
    });

    it('/api/v1/auth/login (POST)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: userDto.email, password: userDto.password })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          authToken = res.body.token;
        });
    });
  });

  describe('Services', () => {
    it('/api/v1/services (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/services')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Vendors', () => {
    it('/api/v1/vendors/search (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/vendors/search')
        .query({ latitude: 5.6037, longitude: -0.1870, radius: 10 })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Items', () => {
    it('/api/v1/items (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/items')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Orders (Protected)', () => {
    it('/api/v1/orders (GET) - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders')
        .expect(401);
    });

    it('/api/v1/orders (GET) - with auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Users (Protected)', () => {
    it('/api/v1/users/credits (GET) - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/credits')
        .expect(401);
    });

    it('/api/v1/users/credits (GET) - with auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/credits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('credits');
        });
    });
  });
});
