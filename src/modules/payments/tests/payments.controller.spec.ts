import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import * as request from 'supertest';
import { PaymentsController } from '../controllers/payments.controller';
import { PaymentsService } from '../services/payments.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TransactionStatus } from '../interfaces/payment-provider.interface';

describe('PaymentsController (e2e)', () => {
  let app: INestApplication;
  let paymentsService: PaymentsService;

  const mockPaymentsService = {
    initializePayment: jest.fn(),
    checkPaymentStatus: jest.fn(),
    getWalletBalance: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .setLogger({ log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(), verbose: jest.fn() } as any)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    paymentsService = moduleFixture.get<PaymentsService>(PaymentsService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /payments/initialize', () => {
    const initializeDto = {
      orderId: 'order-123',
      paymentMethod: 'mobile_money',
      phoneNumber: '+233542853417',
      accountName: 'Patrick Oduro',
      mobileMoneyProvider: 'MTN',
    };

    const mockResponse = {
      paymentId: 'payment-123',
      transactionId: 'DEP_38e955df-884d-4b24-9aa4-173b84c57c29',
      status: TransactionStatus.PENDING,
      amount: 100,
      feeAmount: 0.15,
      userAmount: 100.15,
      reference: 'YRS_1738148709290_order-123',
    };

    it('should initialize payment successfully', async () => {
      mockPaymentsService.initializePayment.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/payments/initialize')
        .send(initializeDto)
        .expect(201);

      expect(response.body).toEqual(mockResponse);
      expect(mockPaymentsService.initializePayment).toHaveBeenCalledWith(initializeDto);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/payments/initialize')
        .send({})
        .expect(400);
    });

    it('should validate phone number format', async () => {
      await request(app.getHttpServer())
        .post('/payments/initialize')
        .send({
          ...initializeDto,
          phoneNumber: 'invalid',
        })
        .expect(400);
    });

    it('should validate payment method enum', async () => {
      await request(app.getHttpServer())
        .post('/payments/initialize')
        .send({
          ...initializeDto,
          paymentMethod: 'invalid_method',
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .post('/payments/initialize')
        .send(initializeDto)
        .expect(403);
    });
  });

  describe('GET /payments/status/:transactionId', () => {
    const transactionId = 'DEP_38e955df-884d-4b24-9aa4-173b84c57c29';

    const mockResponse = {
      transactionId,
      status: TransactionStatus.SUCCESS,
      paymentId: 'payment-123',
    };

    it('should check payment status successfully', async () => {
      mockPaymentsService.checkPaymentStatus.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get(`/payments/status/${transactionId}`)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockPaymentsService.checkPaymentStatus).toHaveBeenCalledWith(transactionId);
    });

    it('should handle not found payment', async () => {
      const notFoundError = new Error('Payment not found');
      notFoundError.name = 'NotFoundException';
      mockPaymentsService.checkPaymentStatus.mockRejectedValue(notFoundError);

      await request(app.getHttpServer())
        .get('/payments/status/invalid-id')
        .expect(500);
    });

    it('should require authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .get(`/payments/status/${transactionId}`)
        .expect(403);
    });
  });

  describe('GET /payments/wallet/balance/:currency', () => {
    const mockResponse = {
      balance: 153.62,
      currency: 'GHS',
    };

    it('should get wallet balance successfully', async () => {
      mockPaymentsService.getWalletBalance.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/payments/wallet/balance/GHS')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockPaymentsService.getWalletBalance).toHaveBeenCalledWith('GHS');
    });

    it('should handle different currencies', async () => {
      const currencies = ['GHS', 'USD', 'EUR'];

      for (const currency of currencies) {
        mockPaymentsService.getWalletBalance.mockResolvedValue({
          balance: 100,
          currency,
        });

        await request(app.getHttpServer())
          .get(`/payments/wallet/balance/${currency}`)
          .expect(200);

        expect(mockPaymentsService.getWalletBalance).toHaveBeenCalledWith(currency);
      }
    });

    it('should require authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .get('/payments/wallet/balance/GHS')
        .expect(403);
    });
  });
});
