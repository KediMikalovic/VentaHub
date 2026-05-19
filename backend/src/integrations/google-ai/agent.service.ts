import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  GoogleGenerativeAI,
  GenerativeModel,
  FunctionDeclaration,
  SchemaType,
  Schema,
} from "@google/generative-ai";
import { PrismaService } from "../../database/prisma.service";

export interface AgentOutput {
  answer: string;
  generatedAt: string;
  toolsUsed: string[];
}

// Veritabani tarih filtresi olusturur.
// startDate / endDate varsa onlari, yoksa days parametresini, o da yoksa son 7 gunu kullanir.
function buildDateFilter(
  days?: number,
  startDate?: string,
  endDate?: string,
): object {
  if (startDate || endDate) {
    const filter: Record<string, Date> = {};
    if (startDate) filter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.lte = end;
    }
    return filter;
  }
  const since = new Date();
  since.setDate(since.getDate() - (days ?? 7));
  return { gte: since };
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly model: GenerativeModel;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY")!;
    const genAI = new GoogleGenerativeAI(apiKey);

    this.model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      tools: [{ functionDeclarations: this.getToolDefinitions() }],
      systemInstruction: this.getSystemPrompt(),
    });

    this.logger.log("AgentService baslatildi.");
  }

  // ── Agent Dongusu ──────────────────────────────────────────────────────────

  async ask(tenantId: string, question: string): Promise<AgentOutput> {
    this.logger.log("Agent sorusu alindi: " + question.slice(0, 80));
    const toolsUsed: string[] = [];

    const chat = this.model.startChat();
    let response = await chat.sendMessage(question);

    for (let i = 0; i < 5; i++) {
      const parts = response.response.candidates?.[0]?.content?.parts ?? [];
      const fnCallPart = parts.find((p) => p.functionCall);

      if (!fnCallPart?.functionCall) break;

      const { name, args } = fnCallPart.functionCall;
      this.logger.log("Tool cagrildi: " + name + " | args: " + JSON.stringify(args));
      toolsUsed.push(name);

      // cannotAnswer tool'u cagrilirsa donguyu kes
      if (name === "cannotAnswer") {
        const reason = (args as Record<string, string>).reason ?? "Bilinmeyen sebep";
        return {
          answer: "Bu soruyu yanıtlamak için gerekli veriye erişimim yok. " + reason,
          generatedAt: new Date().toISOString(),
          toolsUsed,
        };
      }

      const toolResult = await this.executeTool(
        tenantId,
        name,
        (args ?? {}) as Record<string, unknown>,
      );

      // Gemini API array kabul etmiyor, obje icine sariyoruz
      const wrappedResult = Array.isArray(toolResult)
        ? { data: toolResult }
        : (toolResult as object);

      response = await chat.sendMessage([
        {
          functionResponse: {
            name,
            response: wrappedResult,
          },
        },
      ]);
    }

    const rawAnswer = response.response.text().trim();
    const answer =
      rawAnswer.length > 0
        ? rawAnswer
        : "Sorgunuz işlendi ancak sonuç bulunamadı. Belirtilen kriterlere uyan kayıt mevcut değil.";

    this.logger.log(
      "Agent cevabi uretildi. Kullanilan toollar: " +
        (toolsUsed.length > 0 ? toolsUsed.join(", ") : "yok"),
    );

    return { answer, generatedAt: new Date().toISOString(), toolsUsed };
  }

  // ── Tool Executor ──────────────────────────────────────────────────────────

  private async executeTool(
    tenantId: string,
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const days = args.days !== undefined ? Number(args.days) : undefined;
    const startDate = args.startDate as string | undefined;
    const endDate = args.endDate as string | undefined;
    const limit = args.limit !== undefined ? Number(args.limit) : undefined;

    switch (name) {
      case "getOrderByNumber":
        return this.getOrderByNumber(tenantId, args.orderNumber as string);
      case "getRecentOrders":
        return this.getRecentOrders(tenantId, days, startDate, endDate, limit);
      case "getOrdersByStatus":
        return this.getOrdersByStatus(tenantId, args.status as string, days, startDate, endDate);
      case "getTopProducts":
        return this.getTopProducts(tenantId, days, startDate, endDate, limit);
      case "getMostReturnedProducts":
        return this.getMostReturnedProducts(tenantId, days, startDate, endDate, limit);
      case "getLowStockProducts":
        return this.getLowStockProducts(tenantId, args.threshold !== undefined ? Number(args.threshold) : undefined);
      case "getSlaRiskOrders":
        return this.getSlaRiskOrders(tenantId);
      case "getReturnSummary":
        return this.getReturnSummary(tenantId, days, startDate, endDate);
      case "getRevenueStats":
        return this.getRevenueStats(tenantId, days, startDate, endDate);
      default:
        this.logger.warn("Bilinmeyen tool: " + name);
        return { error: "Bilinmeyen tool: " + name };
    }
  }

  // ── Prisma Tool Implementasyonlari ─────────────────────────────────────────

  private async getOrderByNumber(tenantId: string, orderNumber: string) {
    if (!orderNumber) return { error: "orderNumber parametresi gerekli" };

    const order = await this.prisma.order.findFirst({
      where: { orderNumber, tenantId },
      include: {
        items: {
          include: {
            product: { select: { name: true, sku: true } },
            returns: {
              select: {
                claimItemStatus: true,
                customerNote: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!order) return { found: false, orderNumber };
    return order;
  }

  private async getRecentOrders(
    tenantId: string,
    days?: number,
    startDate?: string,
    endDate?: string,
    limit?: number,
  ) {
    const dateFilter = buildDateFilter(days, startDate, endDate);

    const orders = await this.prisma.order.findMany({
      where: { tenantId, orderDate: dateFilter },
      orderBy: { orderDate: "desc" },
      take: limit ?? 10,
      select: {
        orderNumber: true,
        status: true,
        orderDate: true,
        platform: true,
        cargoTrackingNumber: true,
        returnStatus: true,
        items: {
          select: {
            price: true,
            quantity: true,
            netProfit: true,
            product: { select: { name: true } },
          },
        },
      },
    });
    return orders;
  }

  private async getOrdersByStatus(
    tenantId: string,
    status: string,
    days?: number,
    startDate?: string,
    endDate?: string,
  ) {
    if (!status) return { error: "status parametresi gerekli" };

    // Tarih filtresi sadece acikca belirtilmisse uygulanir
    const hasDateFilter = days !== undefined || startDate !== undefined || endDate !== undefined;
    const dateFilter = hasDateFilter ? buildDateFilter(days, startDate, endDate) : undefined;

    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        status: { contains: status, mode: "insensitive" },
        ...(dateFilter ? { orderDate: dateFilter } : {}),
      },
      orderBy: { orderDate: "desc" },
      take: 20,
      select: {
        orderNumber: true,
        status: true,
        orderDate: true,
        cargoTrackingNumber: true,
        cargoProvider: true,
        items: {
          select: {
            quantity: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    return { count: orders.length, orders };
  }

  private async getTopProducts(
    tenantId: string,
    days?: number,
    startDate?: string,
    endDate?: string,
    limit?: number,
  ) {
    const dateFilter = buildDateFilter(days, startDate, endDate);

    const items = await this.prisma.orderItem.findMany({
      where: { order: { tenantId, orderDate: dateFilter } },
      select: {
        price: true,
        quantity: true,
        netProfit: true,
        product: { select: { name: true, sku: true } },
      },
    });

    const productMap = new Map<
      string,
      { name: string; sku: string; quantity: number; revenue: number; netProfit: number }
    >();

    for (const item of items) {
      const key = item.product?.name ?? "Bilinmeyen Urun";
      const existing = productMap.get(key) ?? {
        name: key,
        sku: item.product?.sku ?? "-",
        quantity: 0,
        revenue: 0,
        netProfit: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += Number(item.price) * item.quantity;
      existing.netProfit += Number(item.netProfit ?? 0);
      productMap.set(key, existing);
    }

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit ?? 5)
      .map((p) => ({
        ...p,
        revenue: parseFloat(p.revenue.toFixed(2)),
        netProfit: parseFloat(p.netProfit.toFixed(2)),
      }));
  }

  private async getMostReturnedProducts(
    tenantId: string,
    days?: number,
    startDate?: string,
    endDate?: string,
    limit?: number,
  ) {
    const dateFilter = buildDateFilter(days, startDate, endDate);

    const returns = await this.prisma.returnItem.findMany({
      where: {
        orderItem: { order: { tenantId, orderDate: dateFilter } },
      },
      select: {
        customerNote: true,
        claimItemStatus: true,
        orderItem: {
          select: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });

    const productMap = new Map<string, { name: string; sku: string; returnCount: number }>();
    for (const r of returns) {
      const name = r.orderItem?.product?.name ?? "Bilinmeyen";
      const sku = r.orderItem?.product?.sku ?? "-";
      const existing = productMap.get(name) ?? { name, sku, returnCount: 0 };
      existing.returnCount += 1;
      productMap.set(name, existing);
    }

    return {
      total: returns.length,
      products: Array.from(productMap.values())
        .sort((a, b) => b.returnCount - a.returnCount)
        .slice(0, limit ?? 5),
    };
  }

  private async getLowStockProducts(tenantId: string, threshold?: number) {
    const limit = threshold ?? 10;

    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        stockQuantity: { lte: limit },
      },
      orderBy: { stockQuantity: "asc" },
      select: {
        name: true,
        sku: true,
        barcode: true,
        stockQuantity: true,
        salePrice: true,
      },
    });

    return { threshold: limit, count: products.length, products };
  }

  private async getSlaRiskOrders(tenantId: string) {
    const threshold = new Date(Date.now() - 36 * 60 * 60 * 1000);

    const items = await this.prisma.returnItem.findMany({
      where: {
        orderItem: { order: { tenantId } },
        createdAt: { lte: threshold },
      },
      select: {
        claimItemStatus: true,
        customerNote: true,
        createdAt: true,
        orderItem: {
          select: {
            order: { select: { orderNumber: true, orderDate: true } },
            product: { select: { name: true } },
          },
        },
      },
    });

    return { count: items.length, items };
  }

  private async getReturnSummary(
    tenantId: string,
    days?: number,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = buildDateFilter(days, startDate, endDate);

    const returns = await this.prisma.returnItem.findMany({
      where: {
        orderItem: { order: { tenantId, orderDate: dateFilter } },
      },
      select: {
        customerNote: true,
        claimItemStatus: true,
        createdAt: true,
        orderItem: {
          select: { product: { select: { name: true } } },
        },
      },
    });

    const statusCounts: Record<string, number> = {};
    for (const r of returns) {
      statusCounts[r.claimItemStatus] = (statusCounts[r.claimItemStatus] ?? 0) + 1;
    }

    return {
      total: returns.length,
      statusBreakdown: statusCounts,
      notes: returns
        .filter((r) => r.customerNote)
        .map((r) => ({
          product: r.orderItem?.product?.name ?? "Bilinmeyen",
          note: r.customerNote,
          status: r.claimItemStatus,
        })),
    };
  }

  private async getRevenueStats(
    tenantId: string,
    days?: number,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = buildDateFilter(days, startDate, endDate);

    // Dashboard ile ayni kaynak: OrderItem — boylece grafikteki degerlerle uyumlu olur
    const items = await this.prisma.orderItem.findMany({
      where: { order: { tenantId, orderDate: dateFilter } },
      select: {
        price: true,
        quantity: true,
        netProfit: true,
        commissionAmount: true,
        shippingCost: true,
      },
    });

    let totalRevenue = 0, netProfit = 0, commissionAmount = 0, cargoExpense = 0;
    for (const item of items) {
      totalRevenue += Number(item.price) * item.quantity;
      netProfit += Number(item.netProfit ?? 0);
      commissionAmount += Number(item.commissionAmount ?? 0);
      cargoExpense += Number(item.shippingCost ?? 0);
    }

    const totals = {
      sellerRevenue: parseFloat(totalRevenue.toFixed(2)),
      commissionAmount: parseFloat(commissionAmount.toFixed(2)),
      cargoExpense: parseFloat(cargoExpense.toFixed(2)),
      returnCargoExpense: 0,
      netProfit: parseFloat(netProfit.toFixed(2)),
    };

    return {
      sellerRevenue: totals.sellerRevenue,
      commissionAmount: totals.commissionAmount,
      cargoExpense: totals.cargoExpense,
      returnCargoExpense: totals.returnCargoExpense,
      netProfit: totals.netProfit,
      orderCount: items.length,
    };
  }

  // ── Gemini Tool Tanimlari ──────────────────────────────────────────────────

  private getToolDefinitions(): FunctionDeclaration[] {
    const dateRangeProps: Record<string, Schema> = {
      days: {
        type: SchemaType.NUMBER,
        description: "Kac gunluk gecmis sorgulansin (startDate/endDate yoksa kullanilir), varsayilan 7",
      },
      startDate: {
        type: SchemaType.STRING,
        description: "Baslangic tarihi, ISO 8601 formatinda: 2026-05-15",
      },
      endDate: {
        type: SchemaType.STRING,
        description: "Bitis tarihi, ISO 8601 formatinda: 2026-05-15",
      },
    };

    return [
      {
        name: "getOrderByNumber",
        description:
          "Belirli bir siparis numarasina gore siparis detaylarini, urun bilgilerini ve iade kayitlarini getirir.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            orderNumber: {
              type: SchemaType.STRING,
              description: "Trendyol siparis numarasi, ornek: TY-20240515-018",
            },
          },
          required: ["orderNumber"],
        },
      },
      {
        name: "getRecentOrders",
        description:
          "Belirtilen tarih araligindaki siparisleri durum, urun ve kar bilgileriyle listeler.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            ...dateRangeProps,
            limit: {
              type: SchemaType.NUMBER,
              description: "Kac siparis donecek, varsayilan 10",
            },
          },
        },
      },
      {
        name: "getOrdersByStatus",
        description:
          "Belirli bir durumdaki siparisleri listeler. Ornek durumlar: Created, Picking, Shipped, Delivered, Cancelled.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            status: {
              type: SchemaType.STRING,
              description: "Siparis durumu, ornek: Shipped, Created, Delivered",
            },
            ...dateRangeProps,
          },
          required: ["status"],
        },
      },
      {
        name: "getTopProducts",
        description:
          "En cok satan urunleri ciro, adet ve net kar bazinda sirali listeler.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            ...dateRangeProps,
            limit: {
              type: SchemaType.NUMBER,
              description: "Kac urun donecek, varsayilan 5",
            },
          },
        },
      },
      {
        name: "getMostReturnedProducts",
        description:
          "En cok iade edilen urunleri ve iade adetlerini listeler.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            ...dateRangeProps,
            limit: {
              type: SchemaType.NUMBER,
              description: "Kac urun donecek, varsayilan 5",
            },
          },
        },
      },
      {
        name: "getLowStockProducts",
        description:
          "Stok miktari belirli bir esik degerinin altinda olan urunleri listeler.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            threshold: {
              type: SchemaType.NUMBER,
              description: "Stok esik degeri, bu degerin altindaki urunler gelir. Varsayilan 10.",
            },
          },
        },
      },
      {
        name: "getSlaRiskOrders",
        description:
          "36 saatlik SLA suresini asan, henuz isleme alinmamis iade taleplerini listeler.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
      {
        name: "getReturnSummary",
        description:
          "Belirtilen donem icindeki iadelerin ozet istatistiklerini, durum dagilimini ve musteri notlarini getirir.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: { ...dateRangeProps },
        },
      },
      {
        name: "getRevenueStats",
        description:
          "Finansal muhasebe kayitlarindan ciro, komisyon, kargo gideri ve net kar verilerini getirir.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: { ...dateRangeProps },
        },
      },
      {
        name: "cannotAnswer",
        description:
          "Mevcut araclarla yanitlanamayan sorular icin kullanilir. Tahmin yapma, bu araci cagir.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            reason: {
              type: SchemaType.STRING,
              description: "Neden yanitlanamadigi, hangi bilginin eksik oldugu",
            },
          },
          required: ["reason"],
        },
      },
    ];
  }

  // ── Sistem Promptu ────────────────────────────────────────────────────────

  private getSystemPrompt(): string {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const lines = [
      "Sen VentaHub'in akilli veritabani asistanisin. Trendyol saticilarinin sorularini",
      "yanıtlamak icin verilen araclari kullanarak veritabanindan gercek zamanli veri cekersin.",
      "",
      "BUGUNUN TARIHI: " + today + " — Tarih iceren sorularda bu yili kullan.",
      "",
      "Veritabani yapisi:",
      "- Order: siparis (orderNumber, status [Created=bekliyor/isleniyor, Picking=hazirlaniyor, Shipped=kargoda, Delivered=teslim edildi, Cancelled=iptal], orderDate, cargoTrackingNumber, cargoProvider, platform, returnStatus)",
      "- OrderItem: siparis kalemi (price, quantity, netProfit)",
      "- Product: urun (name, sku, barcode, salePrice, costPrice, stockQuantity)",
      "- ReturnItem: iade talebi (customerNote, claimItemStatus, createdAt)",
      "- FinancialLedger: muhasebe (sellerRevenue, commissionAmount, cargoExpense, netProfit, settlementStatus)",
      "",
      "KURALLARIN — kesinlikle uy:",
      "1. Her zaman once ilgili araci cagir, sonra cevap ver.",
      "2. Veritabaninda olmayan veya araclarla erisilemeyen bilgileri ASLA tahmin etme.",
      "3. Soruyu mevcut araclarla yanitlayamazsan cannotAnswer aracini cagir ve sebebini belirt.",
      "4. Veri bulunamazsa bunu acikca soy, uydurma.",
      "5. Turkce, net ve uygulanabilir cevaplar ver.",
      "6. Sayi ve tarih bilgilerini mutlaka cevaba dahil et.",
      "7. Tarih iceren sorularda startDate/endDate parametrelerini kullan, gunu tam olarak filtrele.",
      "8. Kargoya verilmemis/bekleyen siparis sorularinda status=Created veya status=Picking kullan.",
      "9. getOrdersByStatus kullaniminda tarih filtresi verme; sadece status ile filtrele.",
      "10. Gerekirse birden fazla araci zincirleyerek kullan.",
      "11. Arac sonucu bos veya 0 kayit donse bile bunu Turkce ve net bir sekilde acikla. Hic zaman bos yanit donme.",
    ];
    return lines.join("\n");
  }
}
