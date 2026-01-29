import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaymentsService } from '../services/payments.service';
import { InitializePaymentDto, CheckPaymentStatusDto } from '../dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize payment for order' })
  async initializePayment(@Body() initializeDto: InitializePaymentDto) {
    return this.paymentsService.initializePayment(initializeDto);
  }

  @Get('status/:transactionId')
  @ApiOperation({ summary: 'Check payment transaction status' })
  async checkPaymentStatus(@Param('transactionId') transactionId: string) {
    return this.paymentsService.checkPaymentStatus(transactionId);
  }

  @Get('wallet/balance/:currency')
  @ApiOperation({ summary: 'Get wallet balance' })
  async getWalletBalance(@Param('currency') currency: string) {
    return this.paymentsService.getWalletBalance(currency);
  }
}