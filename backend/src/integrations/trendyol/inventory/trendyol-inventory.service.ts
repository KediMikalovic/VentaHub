import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../../../common/constants/queue.constants';

@Injectable()
export class TrendyolInventoryService {
  private readonly logger = new Logger(TrendyolInventoryService.name);

  constructor(
    @InjectQueue(QUEUES.INVENTORY_UPDATE) private readonly inventoryUpdateQueue: Queue,
  ) {}

  /**
   * Stok/Fiyat güncellemelerini anında fırlatmak yerine güvenli kuyruğa ekler
   */
  async queueInventoryUpdate(tenantId: string, barcode: string, newQuantity: number, newPrice?: number) {
    this.logger.log(`Stok güncellemesi kuyruğa alınıyor. Tenant: ${tenantId}, Barcode: ${barcode}, Yeni Stok: ${newQuantity}`);
    
    // İşçinin hata alması durumunda 3 kez, 5'er saniye aralıklarla tekrar denemesi sağlanıyor
    await this.inventoryUpdateQueue.add('update_inventory', {
      tenantId,
      barcode,
      newQuantity,
      newPrice,
    }, {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 5000,
      }
    });

    return { success: true, message: 'Envanter güncelleme görevi kuyruğa eklendi.' };
  }
}
