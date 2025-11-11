import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './controllers/orders.controller';
import { OrdersService } from './services/orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrdersService = {
    calculateOrder: jest.fn(),
    createOrder: jest.fn(),
    getUserOrders: jest.fn(),
    getOrderById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('calculateOrder', () => {
    it('should calculate order total', async () => {
      const calculateDto = {
        serviceId: 'service123',
        items: [{ 
          itemId: 'item1', 
          name: 'Test Item',
          category: 'clothing',
          categoryId: 'category123',
          quantity: 2,
          weight: 1.5
        }],
        promoCode: 'SAVE10',
      };
      const result = { subtotal: 20, discount: 2, total: 18 };

      mockOrdersService.calculateOrder.mockResolvedValue(result);

      expect(await controller.calculateOrder(calculateDto)).toBe(result);
      expect(service.calculateOrder).toHaveBeenCalledWith(calculateDto);
    });
  });

  describe('createOrder', () => {
    it('should create new order', async () => {
      const createDto = {
        serviceId: 'service123',
        items: [{ 
          itemId: 'item1', 
          name: 'Test Item',
          category: 'clothing',
          categoryId: 'category123',
          quantity: 2,
          weight: 1.5
        }],
        pickupAddress: {
          street: '123 Main St',
          city: 'Accra',
          region: 'Greater Accra',
          phone: '+233123456789'
        },
        deliveryAddress: {
          street: '456 Oak Ave',
          city: 'Accra', 
          region: 'Greater Accra',
          phone: '+233987654321'
        }
      };
      const result = { id: 'order123', status: 'pending', total: 18 };

      mockOrdersService.createOrder.mockResolvedValue(result);

      expect(await controller.createOrder(createDto)).toBe(result);
      expect(service.createOrder).toHaveBeenCalledWith(createDto);
    });
  });

  describe('getUserOrders', () => {
    it('should return user orders', async () => {
      const result = [{ id: 'order123', status: 'pending' }];

      mockOrdersService.getUserOrders.mockResolvedValue(result);

      expect(await controller.getUserOrders()).toBe(result);
      expect(service.getUserOrders).toHaveBeenCalled();
    });
  });
});
