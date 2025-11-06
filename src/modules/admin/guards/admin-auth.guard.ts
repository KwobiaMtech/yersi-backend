import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from '../services/admin.service';
import { AdminRole } from '../schemas/admin.schema';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private adminService: AdminService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Admin token required');
    }

    try {
      const payload = this.jwtService.verify(token);
      const admin = await this.adminService.findById(payload.sub);
      
      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Invalid admin account');
      }

      // Check role requirements
      const requiredRoles = this.reflector.get<AdminRole[]>('roles', context.getHandler());
      if (requiredRoles && !requiredRoles.includes(admin.role)) {
        throw new UnauthorizedException('Insufficient permissions');
      }

      request.admin = admin;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid admin token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
