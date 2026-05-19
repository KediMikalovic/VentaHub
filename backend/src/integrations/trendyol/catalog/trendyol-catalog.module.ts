import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from '../../../common/constants/queue.constants';
import { TrendyolModule } from '../trendyol.module';
import { TrendyolCatalogController } from './trendyol-catalog.controller';
import { TrendyolCatalogService } from './trendyol-catalog.service';
import { CatalogSyncProcessor } from './catalog-sync.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.CATALOG_SYNC,
    }),
    TrendyolModule,
  ],
  controllers: [TrendyolCatalogController],
  providers: [TrendyolCatalogService, CatalogSyncProcessor],
})
export class TrendyolCatalogModule {}
