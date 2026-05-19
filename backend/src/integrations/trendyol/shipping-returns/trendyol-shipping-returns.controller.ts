import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TrendyolShippingService } from './trendyol-shipping.service';
import { ReturnsSlaCron } from './returns-sla.cron';

@Controller('integrations/trendyol')
@UseGuards(JwtAuthGuard)
export class TrendyolShippingReturnsController {
  constructor(
    private readonly shippingService: TrendyolShippingService,
    private readonly returnsSlaCron: ReturnsSlaCron,
  ) {}

  @Post('shipping/create-barcode')
  async createBarcode(
    @CurrentUser() user: any,
    @Body() body: { orderId: string }
  ) {
    return this.shippingService.requestCargoBarcode(user.tenantId, body.orderId);
  }

  @Post('returns/trigger-sla-check')
  async triggerSlaCheck() {
    // Manuel tetikleyici
    return this.returnsSlaCron.checkSlaDeadlines();
  }
}
