import { Module } from "@nestjs/common";
import { BrevoEmailModule } from "./brevo-email/brevo-email.module";
import { EmailService } from "./services/email.service";

@Module({
  imports: [BrevoEmailModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class SharedModule {}
