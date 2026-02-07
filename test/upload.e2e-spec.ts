import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UploadModule } from '../src/common/upload.module';

describe('Upload Integration Test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UploadModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/upload/image', () => {
    it('should reject request without file', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/upload/image')
        .expect(400);

      expect(response.body.message).toContain('No file uploaded');
    });

    it('should reject invalid file type', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/upload/image')
        .attach('file', Buffer.from('test content'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        })
        .expect(400);

      expect(response.body.message).toContain('Only JPEG, PNG, and WebP images are allowed');
    });

    it('should accept valid image file (mock)', async () => {
      // Create a minimal valid JPEG buffer
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
      ]);

      const response = await request(app.getHttpServer())
        .post('/api/v1/upload/image')
        .attach('file', jpegBuffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      // If Wasabi credentials are configured, expect 200, otherwise expect error
      if (process.env.WASABI_ACCESS_KEY_ID && process.env.WASABI_SECRET_ACCESS_KEY) {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('url');
        expect(response.body.url).toContain('wasabisys.com');
        expect(response.body.message).toBe('Image uploaded successfully');
      } else {
        // Without credentials, expect an error
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('should reject file larger than 5MB', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      const response = await request(app.getHttpServer())
        .post('/api/v1/upload/image')
        .attach('file', largeBuffer, {
          filename: 'large.jpg',
          contentType: 'image/jpeg',
        })
        .expect(400);

      expect(response.body.message).toContain('File size must be less than 5MB');
    });
  });
});
