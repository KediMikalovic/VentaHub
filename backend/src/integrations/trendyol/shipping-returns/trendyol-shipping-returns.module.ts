import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from '../../../common/constants/queue.constants';
import { TrendyolModule } from '../trendyol.module';
import { TrendyolShippingReturnsController } from './trendyol-shipping-returns.controller';
import { TrendyolShippingService } from './trendyol-shipping.service';
import { ShippingBarcodeProcessor } from './shipping-barcode.processor';
import { ReturnsSlaCron } from './returns-sla.cron';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.CARGO_BARCODE,
    }),
    TrendyolModule,
  ],
  controllers: [TrendyolShippingReturnsController],
  providers: [TrendyolShippingService, ShippingBarcodeProcessor, ReturnsSlaCron],
})
export class TrendyolShippingReturnsModule {}
