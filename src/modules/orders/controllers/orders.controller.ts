import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto, CalculateOrderDto, OrderCalculationResponseDto } from '../dto/order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('calculate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate order total with weight-based pricing' })
  @ApiResponse({ type: OrderCalculationResponseDto })
  async calculateOrder(@Body() calculateDto: CalculateOrderDto): Promise<OrderCalculationResponseDto> {
    return this.ordersService.calculateOrder(calculateDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new weight-based order' })
  async createOrder(@Body() createDto: CreateOrderDto) {
    return this.ordersService.createOrder(createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user orders with weight information' })
  async getUserOrders() {
    return this.ordersService.getUserOrders();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID with weight details' })
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }
}