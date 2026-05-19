import { Module } from '@nestjs/common';
import { TrendyolFinanceController } from './trendyol-finance.controller';
import { TrendyolFinanceService } from './trendyol-finance.service';

@Module({
  controllers: [TrendyolFinanceController],
  providers: [TrendyolFinanceService],
  exports: [TrendyolFinanceService], // Diğer modüllerden çağrılabilmesi için
})
export class TrendyolFinanceModule {}
