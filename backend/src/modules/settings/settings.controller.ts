import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

@Controller('integrations/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(@CurrentUser() user: any) {
    return this.settingsService.getSettings(user.tenantId);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: any, @Body() data: { companyName?: string; industry?: string }) {
    return this.settingsService.updateProfile(user.tenantId, data);
  }

  @Patch(':id')
  updateIntegration(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { sellerId?: string; apiKey?: string; apiSecret?: string; isActive?: boolean },
  ) {
    return this.settingsService.updateIntegration(user.tenantId, id, data);
  }
}
