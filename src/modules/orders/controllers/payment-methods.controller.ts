import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PaymentMethodsService } from "../services/payment-methods.service";
import {
  AddMobileMoneyDto,
  PaymentMethodResponseDto,
  UpdatePaymentMethodDto,
} from "../dto/payment-method.dto";

@ApiTags("Payment Methods")
@Controller("payment-methods")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentMethodsController {
  constructor(private paymentMethodsService: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: "Get user's saved payment methods" })
  @ApiResponse({ type: [PaymentMethodResponseDto] })
  async getUserPaymentMethods(): Promise<PaymentMethodResponseDto[]> {
    return this.paymentMethodsService.getUserPaymentMethods();
  }

  @Post("mobile-money")
  @ApiOperation({ summary: "Add new mobile money payment method" })
  @ApiResponse({ type: PaymentMethodResponseDto })
  async addMobileMoneyMethod(
    @Body() addMethodDto: AddMobileMoneyDto
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.addMobileMoneyMethod(addMethodDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update payment method details" })
  @ApiResponse({ type: PaymentMethodResponseDto })
  async updatePaymentMethod(
    @Param("id") methodId: string,
    @Body() updateDto: UpdatePaymentMethodDto
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.updatePaymentMethod(methodId, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete payment method" })
  async deletePaymentMethod(@Param("id") methodId: string): Promise<void> {
    return this.paymentMethodsService.deletePaymentMethod(methodId);
  }

  @Post(":id/verify")
  @ApiOperation({ summary: "Verify payment method with OTP" })
  @ApiResponse({ type: PaymentMethodResponseDto })
  async verifyPaymentMethod(
    @Param("id") methodId: string,
    @Body("otp") otp: string
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.verifyPaymentMethod(methodId, otp);
  }
}
