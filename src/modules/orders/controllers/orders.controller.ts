import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { OrdersService } from "../services/orders.service";
import {
  CreateOrderDto,
  CalculateOrderDto,
  OrderCalculationResponseDto,
  UpdateOrderVendorDto,
  UpdateOrderDto,
  ConfirmOrderDto,
} from "../dto/order.dto";
import { CheckoutSummaryDto } from "../dto/checkout.dto";

@ApiTags("Orders")
@Controller("orders")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post("calculate")
  @ApiOperation({ summary: "Calculate order total with weight-based pricing" })
  @ApiResponse({ type: OrderCalculationResponseDto })
  async calculateOrder(
    @Body() calculateDto: CalculateOrderDto
  ): Promise<OrderCalculationResponseDto> {
    return this.ordersService.calculateOrder(calculateDto);
  }

  @Post()
  @ApiOperation({ summary: "Create new weight-based order" })
  async createOrder(@Body() createDto: CreateOrderDto) {
    return this.ordersService.createOrder(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Get user orders with weight information" })
  async getUserOrders() {
    return this.ordersService.getUserOrders();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get order by ID with weight details" })
  async getOrder(@Param("id") id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Get(":id/details")
  @ApiOperation({ summary: "Get order with vendor and service details" })
  async getOrderWithDetails(@Param("id") id: string) {
    return this.ordersService.getOrderWithDetails(id);
  }

  @Get(":id/confirmation-details")
  @ApiOperation({ summary: "Get order details for confirmation screen with current pricing" })
  async getOrderConfirmationDetails(@Param("id") id: string) {
    return this.ordersService.getOrderConfirmationDetails(id);
  }

  @Put(":id/vendor")
  @ApiOperation({ summary: "Update vendor for existing order" })
  async updateOrderVendor(
    @Param("id") orderId: string,
    @Body() updateVendorDto: UpdateOrderVendorDto
  ) {
    return this.ordersService.updateOrderVendor(orderId, updateVendorDto.vendorId);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update order details (vendor, items, addresses, etc.)" })
  async updateOrder(
    @Param("id") orderId: string,
    @Body() updateDto: UpdateOrderDto
  ) {
    return this.ordersService.updateOrder(orderId, updateDto);
  }

  @Post(":id/preview-vendor-pricing")
  @ApiOperation({ summary: "Preview pricing with different vendor without updating order" })
  async previewVendorPricing(
    @Param("id") orderId: string,
    @Body() body: { vendorId: string }
  ) {
    const order = await this.ordersService.getOrderById(orderId);
    return this.ordersService.calculateOrder({
      serviceId: order.serviceId,
      vendorId: body.vendorId,
      items: order.items,
    });
  }

  @Post(":id/confirm")
  @ApiOperation({ summary: "Confirm order with final pricing and vendor selection" })
  async confirmOrder(
    @Param("id") orderId: string,
    @Body() confirmDto: ConfirmOrderDto
  ) {
    return this.ordersService.confirmOrder(orderId, confirmDto);
  }

  @Get(":id/checkout")
  @ApiOperation({ summary: "Get checkout details with delivery and payment options" })
  async getCheckoutDetails(@Param("id") orderId: string) {
    return this.ordersService.getCheckoutDetails(orderId);
  }

  @Post("checkout")
  @ApiOperation({ summary: "Process checkout with delivery and payment selection" })
  async processCheckout(@Body() checkoutDto: CheckoutSummaryDto) {
    return this.ordersService.processCheckout(checkoutDto);
  }
}
