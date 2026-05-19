import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TrendyolApiService } from './trendyol.service';

@Module({
  imports: [HttpModule],
  providers: [TrendyolApiService],
  exports: [TrendyolApiService],
})
export class TrendyolModule {}
