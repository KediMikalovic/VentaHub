import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TrendyolInventoryService } from './trendyol-inventory.service';

@Controller('integrations/trendyol/inventory')
@UseGuards(JwtAuthGuard)
export class TrendyolInventoryController {
  constructor(private readonly inventoryService: TrendyolInventoryService) {}

  @Post('update')
  async updateInventory(
    @CurrentUser() user: any,
    @Body() body: { barcode: string; quantity: number; price?: number }
  ) {
    return this.inventoryService.queueInventoryUpdate(
      user.tenantId,
      body.barcode,
      body.quantity,
      body.price
    );
  }
}
