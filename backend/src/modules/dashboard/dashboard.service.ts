import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getFinanceSummary(tenantId: string) {
    this.logger.log(`Dashboard KPI özeti çekiliyor. TenantID: ${tenantId}`);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Son 7 günün sipariş kalemlerini çek (grafik için order.orderDate lazım)
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          tenantId,
          orderDate: { gte: sevenDaysAgo },
        },
      },
      include: {
        order: { select: { orderDate: true } },
      },
    });

    // SLA Riskli iadeler (36 saat aşmış)
    const slaThreshold = new Date();
    slaThreshold.setHours(slaThreshold.getHours() - 36);

    const slaRiskCount = await this.prisma.returnItem.count({
      where: {
        orderItem: {
          order: { tenantId },
        },
        createdAt: { lte: slaThreshold },
      },
    });

    // Son 7 gün ciro ve kâr toplamaları
    let totalRevenue = 0;
    let totalNetProfit = 0;
    for (const item of orderItems) {
      totalRevenue += Number(item.price) * item.quantity;
      totalNetProfit += Number(item.netProfit || 0);
    }

    // Son 7 günlük grafik verisi (gün gün kırılım)
    const chartMap = new Map<string, { ciro: number; kar: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      chartMap.set(key, { ciro: 0, kar: 0 });
    }

    for (const item of orderItems) {
      const day = new Date(
        item.order?.orderDate ?? new Date(),
      ).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      const entry = chartMap.get(day);
      if (entry) {
        entry.ciro += Number(item.price) * item.quantity;
        entry.kar += Number(item.netProfit || 0);
      }
    }

    const chartData = Array.from(chartMap.entries()).map(([date, v]) => ({
      date,
      ciro: parseFloat(v.ciro.toFixed(2)),
      kar: parseFloat(v.kar.toFixed(2)),
    }));

    this.logger.log(
      `✅ KPI: Ciro=${totalRevenue.toFixed(2)} | Kâr=${totalNetProfit.toFixed(2)} | SLA Risk=${slaRiskCount}`,
    );

    return {
      kpis: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        netProfit: parseFloat(totalNetProfit.toFixed(2)),
        ordersCount: orderItems.length,
        slaRiskCount,
      },
      chartData,
    };
  }
}
