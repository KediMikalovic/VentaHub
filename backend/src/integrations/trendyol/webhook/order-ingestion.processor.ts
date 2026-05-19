import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { QUEUES } from '../../../common/constants/queue.constants';
import { TrendyolInventoryService } from '../inventory/trendyol-inventory.service';
import { TrendyolFinanceService } from '../finance/trendyol-finance.service';

@Processor(QUEUES.ORDER_INGESTION)
export class OrderIngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderIngestionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: TrendyolInventoryService,
    private readonly financeService: TrendyolFinanceService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { tenantId, payload } = job.data;
    
    // Basit bir mock validasyon (Trendyol webhook formatını simüle ediyoruz)
    const orderNumber = payload.orderNumber;
    
    if (!orderNumber) {
      this.logger.warn(`Geçersiz sipariş payload'u, orderNumber eksik. JobID: ${job.id}`);
      return;
    }

    try {
      // 1. Idempotency (Mükerrer Kayıt Koruması)
      const existingOrder = await this.prisma.order.findUnique({
        where: { orderNumber: orderNumber.toString() },
      });

      if (existingOrder) {
        this.logger.log(`[Idempotency] Sipariş zaten mevcut, işlem pas geçiliyor. OrderNumber: ${orderNumber}`);
        return; // İşlemi başarılı olarak sonlandır, kuyruktan düşer
      }

      // Trendyol payload'undan isSellerPayingCargo bilgisi çıkarılabilir (mock: indirim varsa kargo satıcıdan)
      const isSellerPayingCargo = payload.totalDiscount > 0 ? false : true;

      // 2. Veri Ayrıştırma ve Stok Delta Fırlatması
      const itemsData = [];
      for (const line of (payload.lines || [])) {
        const quantity = line.quantity || 1;
        const price = line.price || 0;
        const sku = line.stockCode;
        let productId = null;

        // Stok düşme operasyonu ve Delta Trigger
        if (sku) {
          const product = await this.prisma.product.findFirst({
            where: { tenantId, sku }
          });

          if (product) {
            productId = product.id; // İlişki için ürünü bağlıyoruz
            const newStock = Math.max(0, product.stockQuantity - quantity);
            
            // Veritabanında stoğu güncelle
            await this.prisma.product.update({
              where: { id: product.id },
              data: { stockQuantity: newStock }
            });
            this.logger.log(`Stok düşüldü: SKU: ${sku}, Eski: ${product.stockQuantity}, Yeni: ${newStock}`);

            // Delta'yı Trendyol'a fırlat
            await this.inventoryService.queueInventoryUpdate(tenantId, product.barcode, newStock);
          }
        }

        itemsData.push({ quantity, price, productId });
      }

      // 3. Veritabanına Kayıt (DB Persistence)
      const newOrder = await this.prisma.order.create({
        data: {
          tenantId,
          orderNumber: orderNumber.toString(),
          status: payload.status || 'CREATED',
          orderType: 'STANDARD',
          platform: 'TRENDYOL',
          items: {
            create: itemsData,
          },
        },
      });

      this.logger.log(`✅ Yeni Sipariş başarıyla kaydedildi. OrderNumber: ${newOrder.orderNumber}, TenantID: ${tenantId}`);

      // 4. Kâr Hesaplaması (Asenkron - Fire and Forget)
      this.financeService.calculateOrderProfit(newOrder.id, isSellerPayingCargo)
        .catch(err => this.logger.error(`Sipariş kârı hesaplanırken hata oluştu: ${err.message}`));

      return newOrder;
    } catch (error) {
      this.logger.error(`Sipariş işlenirken hata oluştu: ${(error as Error).message}`);
      throw error; // Hata fırlat ki BullMQ yeniden deneme (retry) yapsın
    }
  }
}
