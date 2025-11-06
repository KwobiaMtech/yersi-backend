import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BrevoEmailService } from './brevo-email.service';


@Module({
  imports: [ConfigModule],
  providers: [BrevoEmailService],
  controllers: [],
  exports: [BrevoEmailService],
})
export class BrevoEmailModule { }
