import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ReturnsSlaCron {
  private readonly logger = new Logger(ReturnsSlaCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkSlaDeadlines() {
    this.logger.log('🕵️‍♂️ SLA Devriyesi (İade Kontrolü) başlatıldı...');

    // 36 saat öncesi: 36 * 60 * 60 * 1000 = 129600000 ms
    const thirtySixHoursAgo = new Date(Date.now() - 36 * 60 * 60 * 1000);

    const riskyOrders = await this.prisma.order.findMany({
      where: {
        returnStatus: 'RETURN_REQUESTED',
        returnRequestedAt: {
          lte: thirtySixHoursAgo,
        }
      },
      select: {
        orderNumber: true,
        tenantId: true,
        returnRequestedAt: true,
        tenant: {
          select: { companyName: true }
        }
      }
    });

    if (riskyOrders.length === 0) {
      this.logger.log('✅ Riskli iade SLA durumu tespit edilmedi. Sistem güvende.');
      return { success: true, count: 0 };
    }

    for (const order of riskyOrders) {
      // Multi-Tenant Kurallı SLA Logu
      this.logger.warn(`SLA RİSKİ: [Sipariş No: ${order.orderNumber}] iadesi için son 12 saat! | Tenant: ${order.tenant.companyName} (${order.tenantId})`);
    }

    return { success: true, count: riskyOrders.length, riskyOrders };
  }
}
