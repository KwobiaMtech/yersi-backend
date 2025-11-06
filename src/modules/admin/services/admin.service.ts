import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Admin, AdminRole } from '../schemas/admin.schema';
import { CreateAdminDto, AdminLoginDto } from '../dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    private jwtService: JwtService,
  ) {}

  async createAdmin(createAdminDto: CreateAdminDto) {
    const existingAdmin = await this.adminModel.findOne({ email: createAdminDto.email });
    if (existingAdmin) {
      throw new ConflictException('Admin with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createAdminDto.password, 12);
    
    const admin = new this.adminModel({
      ...createAdminDto,
      password: hashedPassword,
    });

    await admin.save();
    
    const { password, ...result } = admin.toObject();
    return result;
  }

  async login(loginDto: AdminLoginDto) {
    const admin = await this.adminModel.findOne({ email: loginDto.email });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const payload = { sub: admin._id, email: admin.email, role: admin.role };
    const token = this.jwtService.sign(payload);

    const { password, ...adminData } = admin.toObject();
    return { admin: adminData, token };
  }

  async findById(id: string) {
    return this.adminModel.findById(id).select('-password');
  }

  async getAllAdmins() {
    return this.adminModel.find().select('-password').sort({ createdAt: -1 });
  }

  async getSystemStats() {
    const [totalUsers, totalVendors, totalOrders] = await Promise.all([
      this.adminModel.countDocuments({ role: { $ne: AdminRole.SUPER_ADMIN } }),
      this.adminModel.countDocuments({ role: AdminRole.VENDOR_ADMIN }),
      // Add order count when orders module is available
      Promise.resolve(0),
    ]);

    return {
      totalUsers,
      totalVendors,
      totalOrders,
      systemHealth: 'healthy',
    };
  }

  async deactivateAdmin(id: string) {
    return this.adminModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).select('-password');
  }
}
