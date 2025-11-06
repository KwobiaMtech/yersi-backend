import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  const mockHealthService = {
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health status', async () => {
      const result = {
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 123.45,
        database: { status: 'connected', name: 'laundry-service' },
        redis: { status: 'connected' },
        memory: { rss: 1000000, heapTotal: 2000000, heapUsed: 1500000 },
      };

      mockHealthService.getHealth.mockResolvedValue(result);

      expect(await controller.check()).toBe(result);
      expect(service.getHealth).toHaveBeenCalled();
    });
  });
});
