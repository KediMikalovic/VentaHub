import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../../../common/constants/queue.constants';

@Injectable()
export class TrendyolShippingService {
  private readonly logger = new Logger(TrendyolShippingService.name);

  constructor(
    @InjectQueue(QUEUES.CARGO_BARCODE) private readonly cargoBarcodeQueue: Queue,
  ) {}

  async requestCargoBarcode(tenantId: string, orderId: string) {
    this.logger.log(`Kargo barkodu talebi kuyruğa alınıyor. Tenant: ${tenantId}, Sipariş: ${orderId}`);
    
    await this.cargoBarcodeQueue.add('create_barcode', {
      tenantId,
      orderId,
    }, {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 5000,
      }
    });

    return { success: true, message: 'Kargo barkodu görevi asenkron kuyruğa eklendi.' };
  }
}
