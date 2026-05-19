import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FinanceService, Period } from './finance.service';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // GET /finance/summary?period=weekly
  @Get('summary')
  getSummary(
    @CurrentUser() user: any,
    @Query('period') period: Period = 'weekly',
  ) {
    return this.financeService.getSummary(user.tenantId, period);
  }

  // GET /finance/ledger
  @Get('ledger')
  getLedger(@CurrentUser() user: any) {
    return this.financeService.getLedger(user.tenantId);
  }
}
