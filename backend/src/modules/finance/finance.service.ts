import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export type Period = 'daily' | 'weekly' | 'monthly';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getStartDate(period: Period): Date {
    const now = new Date();
    if (period === 'daily') now.setDate(now.getDate() - 1);
    else if (period === 'weekly') now.setDate(now.getDate() - 7);
    else now.setMonth(now.getMonth() - 1);
    return now;
  }

  // ── GET /finance/summary?period=weekly ───────────────────────────────────
  async getSummary(tenantId: string, period: Period) {
    this.logger.log(`Finans özeti çekiliyor. Tenant: ${tenantId} | Periyot: ${period}`);

    const startDate = this.getStartDate(period);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: { tenantId, orderDate: { gte: startDate } },
      },
      include: {
        order: { select: { orderDate: true, orderNumber: true } },
      },
    });

    let totalRevenue = 0;
    let totalCommission = 0;
    let totalShippingCost = 0;
    let totalNetProfit = 0;

    for (const item of orderItems) {
      totalRevenue     += Number(item.price) * item.quantity;
      totalCommission  += Number(item.commissionAmount ?? 0);
      totalShippingCost += Number(item.shippingCost ?? 0);
      totalNetProfit   += Number(item.netProfit ?? 0);
    }

    // Günlük trend verisi (grafik için)
    const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    const chartMap = new Map<string, { ciro: number; kar: number; komisyon: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      chartMap.set(key, { ciro: 0, kar: 0, komisyon: 0 });
    }

    for (const item of orderItems) {
      const day = new Date(item.order!.orderDate)
        .toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      const entry = chartMap.get(day);
      if (entry) {
        entry.ciro     += Number(item.price) * item.quantity;
        entry.kar      += Number(item.netProfit ?? 0);
        entry.komisyon += Number(item.commissionAmount ?? 0);
      }
    }

    const chartData = Array.from(chartMap.entries()).map(([date, v]) => ({
      date,
      ciro:     parseFloat(v.ciro.toFixed(2)),
      kar:      parseFloat(v.kar.toFixed(2)),
      komisyon: parseFloat(v.komisyon.toFixed(2)),
    }));

    return {
      period,
      kpis: {
        totalRevenue:      parseFloat(totalRevenue.toFixed(2)),
        totalCommission:   parseFloat(totalCommission.toFixed(2)),
        totalShippingCost: parseFloat(totalShippingCost.toFixed(2)),
        totalNetProfit:    parseFloat(totalNetProfit.toFixed(2)),
        profitMargin: totalRevenue > 0
          ? parseFloat(((totalNetProfit / totalRevenue) * 100).toFixed(1))
          : 0,
      },
      chartData,
    };
  }

  // ── GET /finance/ledger ───────────────────────────────────────────────────
  async getLedger(tenantId: string) {
    this.logger.log(`Finansal kayıtlar çekiliyor. Tenant: ${tenantId}`);

    const records = await this.prisma.financialLedger.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        order: { select: { orderNumber: true, orderDate: true, platform: true } },
      },
    });

    return {
      ledger: records.map((r) => ({
        id:                  r.id,
        transactionId:       r.transactionId,
        orderNumber:         r.order?.orderNumber ?? '—',
        orderDate:           r.order?.orderDate?.toISOString().split('T')[0] ?? '—',
        platform:            r.order?.platform ?? 'TRENDYOL',
        sellerRevenue:       parseFloat(r.sellerRevenue.toString()),
        commissionAmount:    parseFloat(r.commissionAmount.toString()),
        cargoExpense:        parseFloat(r.cargoExpense.toString()),
        returnCargoExpense:  parseFloat(r.returnCargoExpense.toString()),
        netProfit:           parseFloat(r.netProfit.toString()),
        settlementStatus:    r.settlementStatus,
        expectedPaymentDate: r.expectedPaymentDate?.toISOString().split('T')[0] ?? null,
      })),
    };
  }
}
