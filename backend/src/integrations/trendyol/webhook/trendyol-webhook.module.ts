import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from '../../../common/constants/queue.constants';
import { TrendyolModule } from '../trendyol.module';
import { TrendyolWebhookController } from './trendyol-webhook.controller';
import { TrendyolWebhookService } from './trendyol-webhook.service';
import { OrderIngestionProcessor } from './order-ingestion.processor';
import { WebhookAuthGuard } from './webhook-auth.guard';
import { TrendyolInventoryModule } from '../inventory/trendyol-inventory.module';
import { TrendyolFinanceModule } from '../finance/trendyol-finance.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.ORDER_INGESTION,
    }),
    TrendyolModule,
    TrendyolInventoryModule,
    TrendyolFinanceModule,
  ],
  controllers: [TrendyolWebhookController],
  providers: [
    TrendyolWebhookService,
    OrderIngestionProcessor,
    WebhookAuthGuard,
  ],
  exports: [TrendyolWebhookService],
})
export class TrendyolWebhookModule {}
