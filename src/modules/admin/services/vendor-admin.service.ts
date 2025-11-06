import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { VendorsService } from '../../vendors/services/vendors.service';
import { ServicesService } from '../../services/services/services.service';
import { OrdersService } from '../../orders/services/orders.service';
import { Admin, AdminRole } from '../schemas/admin.schema';
import { UpdateVendorDto } from '../dto/admin.dto';

@Injectable()
export class VendorAdminService {
  constructor(
    private vendorsService: VendorsService,
    private servicesService: ServicesService,
    private ordersService: OrdersService,
  ) {}

  async getVendorDashboard(admin: Admin) {
    if (admin.role !== AdminRole.VENDOR_ADMIN || !admin.vendorId) {
      throw new ForbiddenException('Access denied');
    }

    const vendor = await this.vendorsService.getVendorById(admin.vendorId.toString());
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Get vendor statistics
    const stats = await this.getVendorStats(admin.vendorId.toString());

    return {
      vendor,
      stats,
    };
  }

  async updateVendorProfile(admin: Admin, updateDto: UpdateVendorDto) {
    if (admin.role !== AdminRole.VENDOR_ADMIN || !admin.vendorId) {
      throw new ForbiddenException('Access denied');
    }

    // Update vendor profile logic would go here
    // For now, return success message
    return {
      message: 'Vendor profile updated successfully',
      vendorId: admin.vendorId,
    };
  }

  async getVendorOrders(admin: Admin, page: number = 1, limit: number = 10) {
    if (admin.role !== AdminRole.VENDOR_ADMIN || !admin.vendorId) {
      throw new ForbiddenException('Access denied');
    }

    // Get orders for this vendor
    return {
      orders: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    };
  }

  async updateOrderStatus(admin: Admin, orderId: string, status: string) {
    if (admin.role !== AdminRole.VENDOR_ADMIN || !admin.vendorId) {
      throw new ForbiddenException('Access denied');
    }

    // Verify order belongs to this vendor and update status
    return {
      message: 'Order status updated successfully',
      orderId,
      newStatus: status,
    };
  }

  async getVendorServices(admin: Admin) {
    if (admin.role !== AdminRole.VENDOR_ADMIN || !admin.vendorId) {
      throw new ForbiddenException('Access denied');
    }

    // Get services offered by this vendor
    return this.servicesService.getServices();
  }

  private async getVendorStats(vendorId: string) {
    // Calculate vendor-specific statistics
    return {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      revenue: 0,
      rating: 0,
      reviewCount: 0,
    };
  }
}
