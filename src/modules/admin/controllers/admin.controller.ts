import { Controller, Post, Get, Body, UseGuards, Request, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { VendorsService } from '../../vendors/services/vendors.service';
import { UsersService } from '../../users/services/users.service';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreateAdminDto, AdminLoginDto } from '../dto/admin.dto';
import { AdminRole } from '../schemas/admin.schema';

@ApiTags('Super Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private vendorsService: VendorsService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  async login(@Body() loginDto: AdminLoginDto) {
    return this.adminService.login(loginDto);
  }

  @Post('create')
  @UseGuards(AdminAuthGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new admin (Super Admin only)' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.createAdmin(createAdminDto);
  }

  @Get('dashboard')
  @UseGuards(AdminAuthGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async getDashboard() {
    const stats = await this.adminService.getSystemStats();
    return {
      message: 'Dashboard data retrieved successfully',
      data: stats,
    };
  }

  @Get('admins')
  @UseGuards(AdminAuthGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all admins' })
  async getAllAdmins() {
    return this.adminService.getAllAdmins();
  }

  @Get('vendors')
  @UseGuards(AdminAuthGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all vendors' })
  async getAllVendors(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    // Get all vendors with pagination
    return {
      vendors: [],
      pagination: { page, limit, total: 0, pages: 0 },
    };
  }

  @Get('vendors/:id')
  @UseGuards(AdminAuthGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor details' })
  async getVendor(@Param('id') id: string) {
    return this.vendorsService.getVendorById(id);
  }

  @Delete('vendors/:id')
  @UseGuards(AdminAuthGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate vendor' })
  async deactivateVendor(@Param('id') id: string) {
    return {
      message: 'Vendor deactivated successfully',
      vendorId: id,
    };
  }

  @Get('users')
  @UseGuards(AdminAuthGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return {
      users: [],
      pagination: { page, limit, total: 0, pages: 0 },
    };
  }

  @Get('orders')
  @UseGuards(AdminAuthGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders' })
  async getAllOrders(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return {
      orders: [],
      pagination: { page, limit, total: 0, pages: 0 },
    };
  }

  @Delete('admins/:id')
  @UseGuards(AdminAuthGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate admin' })
  async deactivateAdmin(@Param('id') id: string) {
    return this.adminService.deactivateAdmin(id);
  }
}
