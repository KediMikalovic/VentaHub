import {
  Injectable,
  Logger,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface ReturnCategory {
  label: string;
  key: string;
  count: number;
  percentage: number;
}

export interface WeeklyReportInput {
  totalRevenue: number;
  netProfit: number;
  ordersCount: number;
  slaRiskCount: number;
  returnCategories: ReturnCategory[];
  totalReturns: number;
}

export interface WeeklyReportOutput {
  summary: string;
  problems: string[];
  recommendations: string[];
  rawText: string;
  generatedAt: string;
}

export interface AskInput {
  question: string;
  kpiSnapshot: {
    totalRevenue: number;
    netProfit: number;
    ordersCount: number;
    slaRiskCount: number;
    totalReturns: number;
  };
}

export interface AskOutput {
  answer: string;
  generatedAt: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly model: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY bulunamadi!');
      throw new InternalServerErrorException('Gemini API anahtari yapilandirilmamis.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    this.model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    this.logger.log('GeminiService baslatildi. Model: gemini-flash-latest');
  }

  async generateWeeklyReport(data: WeeklyReportInput): Promise<WeeklyReportOutput> {
    this.logger.log('Gemini haftalik rapor uretimi baslatildi...');
    const prompt = this.buildWeeklyReportPrompt(data);
    this.logger.debug("=== GEMINI PROMPT ===\n" + prompt + "\n====================");

    try {
      const result = await this.model.generateContent(prompt);
      const rawText = result.response.text();
      this.logger.log('Gemini haftalik rapor uretildi.');
      return {
        ...this.parseJsonReport(rawText),
        rawText,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        'Gemini API hatasi (generateWeeklyReport): ' + (error as Error).message,
      );
      this.handleGeminiError(error);
    }
  }

  async ask(input: AskInput): Promise<AskOutput> {
    this.logger.log('Gemini soru yanitlaniyor...');
    const prompt = this.buildAskPrompt(input);

    try {
      const genAI = new GoogleGenerativeAI(
        this.configService.get<string>('GEMINI_API_KEY')!,
      );
      const plainModel = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
      });

      const result = await plainModel.generateContent(prompt);
      const answer = result.response.text();

      this.logger.log('Gemini soruya yanit uretildi.');
      return { answer, generatedAt: new Date().toISOString() };
    } catch (error) {
      this.logger.error('Gemini API hatasi (ask): ' + (error as Error).message);
      this.handleGeminiError(error);
    }
  }

  private buildWeeklyReportPrompt(data: WeeklyReportInput): string {
    const margin =
      data.totalRevenue > 0
        ? ((data.netProfit / data.totalRevenue) * 100).toFixed(1)
        : '0.0';

    const returnRate =
      data.ordersCount > 0
        ? ((data.totalReturns / data.ordersCount) * 100).toFixed(1)
        : '0.0';

    const categories =
      data.returnCategories.length > 0
        ? data.returnCategories
            .map((c) => c.label + ': %' + c.percentage + ' (' + c.count + ' adet)')
            .join(', ')
        : 'Henuz iade verisi yok';

    return (
      'Sen VentaHub\'in AI finans danismanisin. Trendyol saticilarinin\n' +
      'verilerini Turkce olarak analiz edip oneri sunuyorsun.\n\n' +
      'Son 7 gunluk magaza verileri:\n' +
      '- Toplam Ciro: ' + data.totalRevenue.toLocaleString('tr-TR') + ' TL\n' +
      '- Net Kar: ' + data.netProfit.toLocaleString('tr-TR') + ' TL (Marj: %' + margin + ')\n' +
      '- Siparis Sayisi: ' + data.ordersCount + '\n' +
      '- Toplam Iade: ' + data.totalReturns + ' adet (Oran: %' + returnRate + ')\n' +
      '- SLA Riskli Iade: ' + data.slaRiskCount + ' adet (36 saati asmis)\n' +
      '- Iade Kategorileri: ' + categories + '\n\n' +
      'Bu verileri analiz et. Asagidaki JSON formatinda SADECE JSON dondur:\n' +
      '{"summary":"2-3 cumlelik ozet","problems":["sorun 1"],"recommendations":["oneri 1"]}'
    );
  }

  private buildAskPrompt(input: AskInput): string {
    const margin =
      input.kpiSnapshot.totalRevenue > 0
        ? ((input.kpiSnapshot.netProfit / input.kpiSnapshot.totalRevenue) * 100).toFixed(1)
        : '0.0';

    return (
      'Sen VentaHub\'in AI finans danismanisin.\n\n' +
      'Satici verileri (son 7 gun):\n' +
      '- Ciro: ' + input.kpiSnapshot.totalRevenue.toLocaleString('tr-TR') + ' TL\n' +
      '- Net Kar: ' + input.kpiSnapshot.netProfit.toLocaleString('tr-TR') + ' TL (Marj: %' + margin + ')\n' +
      '- Siparis: ' + input.kpiSnapshot.ordersCount + '\n' +
      '- Iade: ' + input.kpiSnapshot.totalReturns + '\n' +
      '- SLA Risk: ' + input.kpiSnapshot.slaRiskCount + '\n\n' +
      'Soru: "' + input.question + '"\n\n' +
      '3-5 cumle ile somut ve uygulanabilir bir yanit ver.'
    );
  }

  private parseJsonReport(
    rawText: string,
  ): Omit<WeeklyReportOutput, 'rawText' | 'generatedAt'> {
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return {
        summary: parsed.summary ?? '',
        problems: Array.isArray(parsed.problems) ? parsed.problems : [],
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],
      };
    } catch {
      this.logger.warn(
        'Gemini JSON parse edilemedi. Ham metin: ' + cleaned.slice(0, 300),
      );
      return { summary: cleaned.slice(0, 400), problems: [], recommendations: [] };
    }
  }

  private handleGeminiError(error: unknown): never {
    const message = (error as Error)?.message ?? '';

    if (
      message.includes('429') ||
      message.includes('Too Many Requests') ||
      message.includes('quota')
    ) {
      const retryMatch = message.match(/retry.*?(\d+)/i);
      const retrySec = retryMatch ? parseInt(retryMatch[1], 10) : 60;

      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          errorCode: 'RATE_LIMIT',
          message: 'Gemini API kota asildi. Lutfen ' + retrySec + ' saniye sonra tekrar deneyin.',
          retryAfterSeconds: retrySec,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    throw new InternalServerErrorException(
      'AI servisi su an yanit veremiyor. Lutfen tekrar deneyin.',
    );
  }
}
