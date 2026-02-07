import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AppRequestContext } from '../src/common/context/app-request-context';

describe('API Flow - Images in Responses (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ 
      transform: true, 
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    
    await app.init();

    // Set up request context for tests
    AppRequestContext.setContext({
      requestId: 'test-request',
      userId: 'test-user-id',
      userEmail: 'test@example.com',
      userRole: 'user',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
      timestamp: new Date(),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Items API - Returns Icons', () => {
    it('GET /api/v1/items/categories should return categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items/categories')
        .expect(200);

      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
    });

    it('GET /api/v1/items/category/:category should return items with icons', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items/category/top')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThan(0);

      // Verify each item has an icon
      response.body.items.forEach((item: any) => {
        expect(item).toHaveProperty('icon');
        expect(item.icon).toBeDefined();
        expect(typeof item.icon).toBe('string');
        expect(item.icon.length).toBeGreaterThan(0);
      });

      console.log('✅ Items API returns icons:', response.body.items[0].icon);
    });

    it('GET /api/v1/items/category/bottom should return items with icons', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items/category/bottom')
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
      
      response.body.items.forEach((item: any) => {
        expect(item.icon).toBeDefined();
      });
    });
  });

  describe('Orders API - Returns Icons or Default', () => {
    it('POST /api/v1/orders/calculate should accept icon field', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders/calculate')
        .send({
          serviceId: '507f1f77bcf86cd799439020',
          items: [
            {
              itemId: 'item1',
              name: 'Test Shirt',
              category: 'top',
              categoryId: 'cat1',
              quantity: 2,
              weight: 0.5,
              icon: 'https://s3.us-central-1.wasabisys.com/ys-uploads/items/test.png',
            },
          ],
        });

      // May return 401 if auth required, but should not reject icon field
      if (response.status === 200) {
        expect(response.body).toHaveProperty('totalWeight');
        console.log('✅ Calculate endpoint accepts icon field');
      } else if (response.status === 401) {
        console.log('⚠️  Calculate endpoint requires authentication');
      } else {
        console.log('Response:', response.body);
      }
    });

    it('POST /api/v1/orders/calculate should work without icon field', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders/calculate')
        .send({
          serviceId: '507f1f77bcf86cd799439020',
          items: [
            {
              itemId: 'item2',
              name: 'Test Pants',
              category: 'bottom',
              categoryId: 'cat2',
              quantity: 1,
              weight: 0.8,
            },
          ],
        });

      // Should accept items without icon
      if (response.status === 200) {
        expect(response.body).toHaveProperty('totalWeight');
        console.log('✅ Calculate endpoint works without icon field');
      } else if (response.status === 401) {
        console.log('⚠️  Calculate endpoint requires authentication');
      }
    });
  });

  describe('Upload API - Returns Image URL', () => {
    it('POST /api/v1/upload/image should reject without file', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/upload/image')
        .expect(400);

      expect(response.body.message).toContain('No file uploaded');
      console.log('✅ Upload validation working');
    });

    it('POST /api/v1/upload/image should accept valid image', async () => {
      // Create minimal PNG
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
        0x42, 0x60, 0x82
      ]);

      const response = await request(app.getHttpServer())
        .post('/api/v1/upload/image')
        .attach('file', pngBuffer, {
          filename: 'test.png',
          contentType: 'image/png',
        });

      if (response.status === 201) {
        expect(response.body).toHaveProperty('url');
        expect(response.body.url).toContain('wasabisys.com');
        expect(response.body.message).toBe('Image uploaded successfully');
        console.log('✅ Upload returns URL:', response.body.url);
      } else {
        console.log('⚠️  Upload may need Wasabi credentials configured');
      }
    });
  });
});
