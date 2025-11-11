import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

export class TestUtils {
  static async authenticateUser(app: INestApplication): Promise<{ token: string; userId: string }> {
    const userDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
    };

    // Register user
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(userDto);

    // Login user
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userDto.email, password: userDto.password });

    return {
      token: loginResponse.body.token,
      userId: loginResponse.body.user.id
    };
  }

  static async createTestVendor(app: INestApplication, token: string) {
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
      .set('Authorization', `Bearer ${token}`)
      .send(vendorData);

    return response.body;
  }

  static async createTestService(app: INestApplication, token: string) {
    const serviceData = {
      name: 'Dry Cleaning',
      description: 'Professional dry cleaning service',
      category: 'cleaning',
      basePrice: 15.99
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${token}`)
      .send(serviceData);

    return response.body;
  }

  static async createTestItem(app: INestApplication, token: string) {
    const itemData = {
      name: 'Shirt',
      category: 'clothing',
      description: 'Cotton shirt',
      basePrice: 5.99
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/items')
      .set('Authorization', `Bearer ${token}`)
      .send(itemData);

    return response.body;
  }

  static expectValidationError(response: any) {
    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  }

  static expectUnauthorized(response: any) {
    expect(response.status).toBe(401);
  }

  static expectForbidden(response: any) {
    expect(response.status).toBe(403);
  }
}
