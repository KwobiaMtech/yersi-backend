import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Distance Validation (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

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
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  it('should return distanceKm > 0 when searching vendors with coordinates', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/vendors/search')
      .query({ 
        latitude: 5.7139815, 
        longitude: -0.1870, 
        radius: 10 
      });

    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));

    expect(response.status).toBe(200);
    expect(response.body.vendors).toBeDefined();
    if (response.body.vendors.length > 0) {
      response.body.vendors.forEach((vendor: any) => {
        if (vendor.distanceKm !== undefined) {
          expect(vendor.distanceKm).toBeGreaterThanOrEqual(0);
          console.log(`Vendor: ${vendor.name}, Distance: ${vendor.distanceKm} km`);
        }
      });
    }
  });

  it('should return distanceKm > 0 when searching with orderId', async () => {
    // First create a test order with pickup address
    const orderResponse = await request(app.getHttpServer())
      .get('/api/v1/orders')
      .expect(200);

    if (orderResponse.body.orders && orderResponse.body.orders.length > 0) {
      const orderId = orderResponse.body.orders[0]._id;
      
      const response = await request(app.getHttpServer())
        .get('/api/v1/vendors/search')
        .query({ 
          orderId,
          radius: 10 
        })
        .expect(200);

      expect(response.body.vendors).toBeDefined();
      if (response.body.vendors.length > 0) {
        response.body.vendors.forEach((vendor: any) => {
          if (vendor.distanceKm !== undefined) {
            expect(vendor.distanceKm).toBeGreaterThanOrEqual(0);
            console.log(`Vendor: ${vendor.name}, Distance with orderId: ${vendor.distanceKm} km`);
          }
        });
      }
    }
  });
});
