import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TrendyolApiService } from '../trendyol.service';
import { QUEUES } from '../../../common/constants/queue.constants';

@Processor(QUEUES.INVENTORY_UPDATE)
export class InventoryUpdateProcessor extends WorkerHost {
  private readonly logger = new Logger(InventoryUpdateProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly trendyolApi: TrendyolApiService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { tenantId, barcode, newQuantity, newPrice } = job.data;
    
    this.logger.debug(`[Stok İşçisi] Tenant: ${tenantId} | Barcode: ${barcode} işleniyor...`);

    try {
      // 1. KOBİ İzolasyonu: Tenant API anahtarlarını (sellerId vb.) buluyoruz
      const integration = await this.prisma.tenantIntegration.findFirst({
        where: { tenantId, platform: 'TRENDYOL', isActive: true },
      });

      if (!integration) {
        this.logger.warn(`Tenant ${tenantId} için aktif Trendyol entegrasyonu bulunamadı. İşlem iptal.`);
        return;
      }

      const { sellerId } = integration;

      // 2. Trendyol Payload Formatı Hazırlığı
      const payload: any = {
        items: [
          {
            barcode: barcode,
            quantity: newQuantity,
          }
        ]
      };

      if (newPrice !== undefined) {
        payload.items[0].salePrice = newPrice;
        // İhtiyaca göre listPrice da gönderilebilir.
      }

      // 3. Rate Limit Korumalı TrendyolApiService üzerinden istek at
      // İstek ucu: /providers/{sellerId}/products/price-and-inventory
      const response = await this.trendyolApi.request<any>(
        'POST',
        `/providers/${sellerId}/products/price-and-inventory`,
        payload
      );

      // Başarılı log
      this.logger.log(`✅ Stok güncellendi! Barcode: ${barcode}, Kalan Stok: ${newQuantity}, BatchRequestID: ${response?.batchRequestId || 'Bilinmiyor'}`);

      return response;
    } catch (error) {
      this.logger.error(`Stok güncellenirken hata oluştu: ${(error as Error).message}`);
      throw error; // Hata fırlatarak BullMQ'nun belirlediğimiz attempts ve backoff mekanizmasını tetiklemesini sağlıyoruz
    }
  }
}
