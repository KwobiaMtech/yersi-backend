import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ClothingCategory } from '../src/modules/items/schemas/item.schema';

describe('Admin Items E2E', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  const adminApiKey = 'test-admin-key-123';

  beforeAll(async () => {
    process.env.ADMIN_API_KEY = adminApiKey;
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        MongooseModule.forRoot(mongoUri),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('/admin/items (POST)', () => {
    it('should create item with valid category', async () => {
      const categoryData = { name: 'Test Category', description: 'Test Description' };
      const categoryResponse = await request(app.getHttpServer())
        .post('/admin/services/categories')
        .set('x-admin-api-key', adminApiKey)
        .send(categoryData)
        .expect(201);

      const itemData = {
        name: 'Test Item',
        category: ClothingCategory.TOP,
        categoryId: categoryResponse.body._id,
        price: 100,
        icon: 'test-icon',
        description: 'Test item description'
      };

      return request(app.getHttpServer())
        .post('/admin/items')
        .set('x-admin-api-key', adminApiKey)
        .send(itemData)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(itemData.name);
          expect(res.body.price).toBe(itemData.price);
        });
    });

    it('should return 400 for invalid category', async () => {
      const itemData = {
        name: 'Test Item',
        category: ClothingCategory.TOP,
        categoryId: '507f1f77bcf86cd799439011',
        price: 100,
        icon: 'test-icon'
      };

      return request(app.getHttpServer())
        .post('/admin/items')
        .set('x-admin-api-key', adminApiKey)
        .send(itemData)
        .expect(400);
    });

    it('should return 401 without admin API key', async () => {
      const itemData = {
        name: 'Test Item',
        category: ClothingCategory.TOP,
        categoryId: '507f1f77bcf86cd799439011',
        price: 100,
        icon: 'test-icon'
      };

      return request(app.getHttpServer())
        .post('/admin/items')
        .send(itemData)
        .expect(401);
    });
  });

  describe('/admin/items/category/:categoryId (GET)', () => {
    it('should get items by category', async () => {
      const categoryResponse = await request(app.getHttpServer())
        .post('/admin/services/categories')
        .set('x-admin-api-key', adminApiKey)
        .send({ name: 'Test Category', description: 'Test' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/admin/items')
        .set('x-admin-api-key', adminApiKey)
        .send({
          name: 'Test Item',
          category: ClothingCategory.TOP,
          categoryId: categoryResponse.body._id,
          price: 100,
          icon: 'test-icon'
        })
        .expect(201);

      return request(app.getHttpServer())
        .get(`/admin/items/category/${categoryResponse.body._id}`)
        .set('x-admin-api-key', adminApiKey)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return 401 without admin API key', async () => {
      return request(app.getHttpServer())
        .get('/admin/items/category/507f1f77bcf86cd799439011')
        .expect(401);
    });
  });
});
