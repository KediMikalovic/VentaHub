import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TrendyolCatalogService } from './trendyol-catalog.service';

@Controller('integrations/trendyol/catalog')
@UseGuards(JwtAuthGuard)
export class TrendyolCatalogController {
  constructor(private readonly catalogService: TrendyolCatalogService) {}

  @Post('sync')
  async syncCatalog(@CurrentUser() user: any) {
    return this.catalogService.triggerCatalogSync(user.tenantId);
  }
}
