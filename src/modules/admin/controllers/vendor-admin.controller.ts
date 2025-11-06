import { Controller, Get, Put, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorAdminService } from '../services/vendor-admin.service';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { UpdateVendorDto } from '../dto/admin.dto';
import { AdminRole } from '../schemas/admin.schema';

@ApiTags('Vendor Admin')
@Controller('vendor-admin')
@UseGuards(AdminAuthGuard)
@Roles(AdminRole.VENDOR_ADMIN)
@ApiBearerAuth()
export class VendorAdminController {
  constructor(private vendorAdminService: VendorAdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get vendor dashboard' })
  async getDashboard(@Request() req) {
    return this.vendorAdminService.getVendorDashboard(req.admin);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update vendor profile' })
  async updateProfile(@Request() req, @Body() updateDto: UpdateVendorDto) {
    return this.vendorAdminService.updateVendorProfile(req.admin, updateDto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get vendor orders' })
  async getOrders(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.vendorAdminService.getVendorOrders(req.admin, page, limit);
  }

  @Put('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  async updateOrderStatus(
    @Request() req,
    @Param('id') orderId: string,
    @Body('status') status: string,
  ) {
    return this.vendorAdminService.updateOrderStatus(req.admin, orderId, status);
  }

  @Get('services')
  @ApiOperation({ summary: 'Get vendor services' })
  async getServices(@Request() req) {
    return this.vendorAdminService.getVendorServices(req.admin);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get vendor analytics' })
  async getAnalytics(@Request() req) {
    return {
      message: 'Analytics data retrieved successfully',
      data: {
        ordersThisMonth: 0,
        revenueThisMonth: 0,
        averageRating: 0,
        topServices: [],
      },
    };
  }
}
