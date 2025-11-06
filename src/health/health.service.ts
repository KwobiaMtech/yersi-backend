import { Injectable, Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private connection: Connection,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getHealth() {
    const dbStatus = this.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    let redisStatus = 'unknown';
    try {
      await this.cacheManager.set('health-check', 'ok', 1000);
      const result = await this.cacheManager.get('health-check');
      redisStatus = result === 'ok' ? 'connected' : 'disconnected';
    } catch (error) {
      redisStatus = 'disconnected';
    }
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        name: this.connection.name
      },
      redis: {
        status: redisStatus
      },
      memory: process.memoryUsage(),
    };
  }
}
