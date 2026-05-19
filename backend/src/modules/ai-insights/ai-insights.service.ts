import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { GeminiService, ReturnCategory, WeeklyReportOutput } from "../../integrations/google-ai/gemini.service";
import { NlApiService } from "../../integrations/google-ai/nl-api.service";
import { AgentService, AgentOutput } from "../../integrations/google-ai/agent.service";

@Injectable()
export class AiInsightsService {
  private readonly logger = new Logger(AiInsightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly nlApiService: NlApiService,
    private readonly agentService: AgentService,
  ) {}

  // ── 1. Haftalik Akilli Rapor (GeminiService - dokunulmadi) ─────────────────

  async getWeeklyReport(tenantId: string): Promise<WeeklyReportOutput> {
    this.logger.log("Haftalik AI raporu hazirlaniyor. TenantID: " + tenantId);

    const kpis = await this.fetchKpis(tenantId);
    const { categories, totalReturns } = await this.categorizeReturns(tenantId);

    const report = await this.geminiService.generateWeeklyReport({
      ...kpis,
      returnCategories: categories,
      totalReturns,
    });

    this.logger.log("Haftalik AI raporu tamamlandi.");
    return report;
  }

  // ── 2. Serbest Soru / Ask AI (AgentService ile) ────────────────────────────

  async askQuestion(tenantId: string, question: string): Promise<AgentOutput> {
    this.logger.log("Agent sorusu alindi. TenantID: " + tenantId);
    return this.agentService.ask(tenantId, question);
  }

  // ── 3. Iade Analizi ───────────────────────────────────────────────────────

  async getReturnAnalysis(tenantId: string): Promise<{
    categories: ReturnCategory[];
    totalReturns: number;
    analyzedAt: string;
  }> {
    this.logger.log("Iade analizi cekiliyor. TenantID: " + tenantId);
    const { categories, totalReturns } = await this.categorizeReturns(tenantId);
    return {
      categories,
      totalReturns,
      analyzedAt: new Date().toISOString(),
    };
  }

  // ── Ozel Yardimci Metodlar ────────────────────────────────────────────────

  private async fetchKpis(tenantId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          tenantId,
          orderDate: { gte: sevenDaysAgo },
        },
      },
    });

    let totalRevenue = 0;
    let netProfit = 0;
    for (const item of orderItems) {
      totalRevenue += Number(item.price) * item.quantity;
      netProfit += Number(item.netProfit ?? 0);
    }

    const slaThreshold = new Date(Date.now() - 36 * 60 * 60 * 1000);
    const slaRiskCount = await this.prisma.returnItem.count({
      where: {
        orderItem: { order: { tenantId } },
        createdAt: { lte: slaThreshold },
      },
    });

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      ordersCount: orderItems.length,
      slaRiskCount,
    };
  }

  private async categorizeReturns(tenantId: string): Promise<{
    categories: ReturnCategory[];
    totalReturns: number;
  }> {
    const returns = await this.prisma.returnItem.findMany({
      where: { orderItem: { order: { tenantId } } },
      select: { customerNote: true },
    });

    const totalReturns = returns.length;

    if (totalReturns === 0) {
      return { categories: [], totalReturns: 0 };
    }

    const notes = returns.map((r) => r.customerNote ?? "");
    const analyzed = await this.nlApiService.analyzeNotes(notes);

    const counts: Record<string, number> = {
      SIZE_MISMATCH: 0,
      DAMAGED: 0,
      WRONG_ITEM: 0,
      QUALITY: 0,
      OTHER: 0,
    };

    const categoryLabels: Record<string, string> = {
      SIZE_MISMATCH: "Beden Uyumsuzlugu",
      DAMAGED: "Hasarli / Bozuk",
      WRONG_ITEM: "Yanlis Urun",
      QUALITY: "Kalite Sorunu",
      OTHER: "Diger",
    };

    for (const result of analyzed) {
      counts[result.category] = (counts[result.category] ?? 0) + 1;
    }

    const categories: ReturnCategory[] = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => ({
        key,
        label: categoryLabels[key] ?? key,
        count,
        percentage: parseFloat(((count / totalReturns) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);

    return { categories, totalReturns };
  }
}
