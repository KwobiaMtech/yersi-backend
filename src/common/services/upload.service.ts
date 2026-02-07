import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private endpoint: string;

  constructor() {
    this.region = process.env.WASABI_REGION || 'us-east-1';
    this.bucketName = process.env.WASABI_BUCKET || 'yersi-uploads';
    this.endpoint = process.env.WASABI_ENDPOINT || `https://s3.${this.region}.wasabisys.com`;
    
    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
        secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadImage(file: Express.Multer.File & { buffer: Buffer }): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    const fileExtension = file.originalname.split('.').pop();
    const fileName = `items/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    return `${this.endpoint}/${this.bucketName}/${fileName}`;
  }

  getDefaultItemImage(): string {
    return `${this.endpoint}/${this.bucketName}/defaults/item-placeholder.png`;
  }
}
