import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class TrendyolFinanceService {
  private readonly logger = new Logger(TrendyolFinanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sipariş kârını hesaplayan otonom muhasebe motoru
   */
  async calculateOrderProfit(orderId: string, isSellerPayingCargo: boolean = true) {
    this.logger.log(`Kâr hesaplaması başlatıldı. Sipariş: ${orderId}`);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      this.logger.warn(`Kâr hesabı için sipariş bulunamadı: ${orderId}`);
      return;
    }

    // Trendyol kargo mantığı: Eğer satıcı ödüyorsa (örn: desi baremini geçtiyse), sabit ücret düş.
    // Eğer müşteri ödüyorsa satıcının cebinden çıkmadığı için kârı etkilemez.
    const orderShippingCost = isSellerPayingCargo ? 39.90 : 0.0; 
    let remainingShippingCost = orderShippingCost;

    for (const [index, item] of order.items.entries()) {
      if (!item.product) {
        this.logger.warn(`OrderItem ${item.id} için eşleşen ürün bulunamadı, kâr hesaplanamıyor.`);
        continue;
      }

      const salePrice = Number(item.price);
      const quantity = item.quantity;
      const totalGross = salePrice * quantity;

      // 1. KDV Hesaplaması (Ürüne özel KDV oranı)
      const vatRate = item.product.vatRate || 20;
      const vatAmount = totalGross - (totalGross / (1 + vatRate / 100));
      
      // 2. Alış Maliyeti
      const costPrice = Number(item.product.costPrice || 0) * quantity;

      // 3. Komisyon Hesaplaması (Trendyol ortalama kategori %15)
      const commissionRate = 0.15; 
      const commissionAmount = totalGross * commissionRate;

      // 4. Kargo maliyetini bölüştürme (ilk kaleme tüm kargoyu yansıtıyoruz)
      const itemShippingCost = index === 0 ? remainingShippingCost : 0;

      // 5. Net Kâr = Satış - Komisyon - Kargo - Maliyet - KDV
      const netProfit = totalGross - commissionAmount - itemShippingCost - costPrice - vatAmount;

      await this.prisma.orderItem.update({
        where: { id: item.id },
        data: {
          commissionRate,
          commissionAmount,
          shippingCost: itemShippingCost,
          netProfit,
        }
      });
    }

    this.logger.log(`✅ Sipariş kârı hesaplandı ve kaydedildi. Sipariş No: ${order.orderNumber}`);
  }
}
