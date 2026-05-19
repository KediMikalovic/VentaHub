import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../database/prisma.service';

@Controller('integrations/trendyol/finance')
@UseGuards(JwtAuthGuard)
export class TrendyolFinanceController {
  private readonly logger = new Logger(TrendyolFinanceController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post('summary')
  async getFinanceSummary(
    @CurrentUser() user: any,
    @Body() body: { period: 'daily' | 'weekly' | 'monthly' }
  ) {
    this.logger.log(`CFO Dashboard API tetiklendi. Tenant: ${user.tenantId}, Periyot: ${body.period}`);

    // Tarih aralığını hesapla
    const now = new Date();
    let startDate = new Date();

    if (body.period === 'daily') {
      startDate.setDate(now.getDate() - 1);
    } else if (body.period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    // Seçili tarihten bu yana olan sipariş kalemlerini getir
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          tenantId: user.tenantId,
          orderDate: { gte: startDate }
        }
      }
    });

    // Toplamları hesapla
    let totalRevenue = 0;
    let totalCommission = 0;
    let totalShippingCost = 0;
    let totalNetProfit = 0;

    for (const item of orderItems) {
      totalRevenue += Number(item.price) * item.quantity;
      totalCommission += Number(item.commissionAmount || 0);
      totalShippingCost += Number(item.shippingCost || 0);
      totalNetProfit += Number(item.netProfit || 0);
    }

    this.logger.log(`✅ Finansal Rapor başarıyla oluşturuldu. Toplam Net Kâr: ${totalNetProfit.toFixed(2)} TL`);

    return {
      period: body.period,
      startDate,
      endDate: now,
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        totalCommission: totalCommission.toFixed(2),
        totalShippingCost: totalShippingCost.toFixed(2),
        totalNetProfit: totalNetProfit.toFixed(2),
      }
    };
  }
}
