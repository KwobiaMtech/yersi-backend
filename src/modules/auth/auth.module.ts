import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { OTPRepository } from './repositories/otp.repository';
import { User, UserSchema } from './schemas/user.schema';
import { OTP, OTPSchema } from './schemas/otp.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: OTP.name, schema: OTPSchema },
    ]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'laundry-secret',
      signOptions: { expiresIn: '1h' },
    }),
    SharedModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, OTPRepository, JwtStrategy],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}