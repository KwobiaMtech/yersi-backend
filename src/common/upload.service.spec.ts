import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from '../common/services/upload.service';

describe('Upload Service', () => {
  let uploadService: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    uploadService = module.get<UploadService>(UploadService);
  });

  describe('getDefaultItemImage', () => {
    it('should return default image URL', () => {
      const defaultImage = uploadService.getDefaultItemImage();
      
      expect(defaultImage).toBeDefined();
      expect(defaultImage).toContain('item-placeholder.png');
      expect(defaultImage).toMatch(/^https:\/\//);
    });
  });

  describe('uploadImage', () => {
    it('should reject files without proper mime type', async () => {
      const invalidFile = {
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('test'),
      } as any;

      await expect(uploadService.uploadImage(invalidFile))
        .rejects.toThrow('Only JPEG, PNG, and WebP images are allowed');
    });

    it('should reject files larger than 5MB', async () => {
      const largeFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024, // 6MB
        buffer: Buffer.from('test'),
      } as any;

      await expect(uploadService.uploadImage(largeFile))
        .rejects.toThrow('File size must be less than 5MB');
    });

    it('should reject null file', async () => {
      await expect(uploadService.uploadImage(null))
        .rejects.toThrow('No file provided');
    });
  });
});
