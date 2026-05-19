import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TrendyolApiService } from '../trendyol.service';
import { QUEUES } from '../../../common/constants/queue.constants';

@Processor(QUEUES.CATALOG_SYNC)
export class CatalogSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(CatalogSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly trendyolApi: TrendyolApiService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { tenantId, sellerId, page, size } = job.data;
    
    this.logger.debug(`[Sayfa İşçisi] Tenant: ${tenantId} | Sayfa: ${page} çekiliyor...`);

    try {
      // 1. Rate Limit Kurallarına Uygun Veri Çekimi (TrendyolApiService üzerinden)
      const response = await this.trendyolApi.request<any>(
        'GET',
        `/providers/${sellerId}/products?page=${page}&size=${size}`
      );

      const products = response?.content || [];
      if (products.length === 0) return;

      // 2. Veri Eşleştirme ve Çoklu Kiracı İzolasyonu ile Upsert İşlemi
      for (const item of products) {
        const barcode = item.barcode || `N/A-${Date.now()}`;
        const sku = item.stockCode || 'UNKNOWN';
        const name = item.title || 'İsimsiz Ürün';
        const stockQuantity = item.quantity || 0;
        const listPrice = item.listPrice || 0;
        const salePrice = item.salePrice || 0;

        // @@unique([tenantId, barcode]) kullanarak güvenli upsert
        await this.prisma.product.upsert({
          where: {
            tenantId_barcode: {
              tenantId,
              barcode,
            },
          },
          update: {
            name,
            sku,
            stockQuantity,
            listPrice,
            salePrice,
            lastSyncAt: new Date(),
          },
          create: {
            tenantId,
            barcode,
            sku,
            name,
            stockQuantity,
            listPrice,
            salePrice,
            lastSyncAt: new Date(),
          },
        });
      }

      this.logger.log(`✅ Sayfa ${page} başarıyla kalıcılaştırıldı. (${products.length} ürün)`);

    } catch (error) {
      this.logger.error(`Sayfa ${page} çekilirken hata oluştu: ${(error as Error).message}`);
      throw error; // İşçi görevi retry edebilmesi için hatayı fırlatıyoruz
    }
  }
}
