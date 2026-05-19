import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from '../../../common/constants/queue.constants';
import { TrendyolModule } from '../trendyol.module';
import { TrendyolInventoryController } from './trendyol-inventory.controller';
import { TrendyolInventoryService } from './trendyol-inventory.service';
import { InventoryUpdateProcessor } from './inventory-update.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.INVENTORY_UPDATE,
    }),
    TrendyolModule,
  ],
  controllers: [TrendyolInventoryController],
  providers: [TrendyolInventoryService, InventoryUpdateProcessor],
  exports: [TrendyolInventoryService],
})
export class TrendyolInventoryModule {}
