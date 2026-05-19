import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AiInsightsService } from './ai-insights.service';
import { AskQuestionDto } from './dto/ask-question.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('ai-insights')
export class AiInsightsController {
  private readonly logger = new Logger(AiInsightsController.name);

  constructor(private readonly aiInsightsService: AiInsightsService) {}

  /**
   * GET /ai-insights/weekly-report
   *
   * Son 7 günlük KPI + iade analizi verilerini Gemini'ye göndererek
   * Türkçe özet, sorun listesi ve öneriler içeren yapılandırılmış rapor döndürür.
   */
  @Get('weekly-report')
  async getWeeklyReport(@CurrentUser() user: { tenantId: string }) {
    this.logger.log(`Haftalık rapor isteği. TenantID: ${user.tenantId}`);
    return this.aiInsightsService.getWeeklyReport(user.tenantId);
  }

  /**
   * GET /ai-insights/return-analysis
   *
   * Müşteri iade notlarını kategorize ederek dağılımı döndürür.
   * NlApiService entegrasyonuna kadar keyword tabanlı çalışır.
   */
  @Get('return-analysis')
  async getReturnAnalysis(@CurrentUser() user: { tenantId: string }) {
    this.logger.log(`İade analizi isteği. TenantID: ${user.tenantId}`);
    return this.aiInsightsService.getReturnAnalysis(user.tenantId);
  }

  /**
   * POST /ai-insights/ask
   *
   * Satıcının serbest sorusunu güncel KPI bağlamıyla birlikte Gemini'ye iletir.
   * Body: { "question": "Bu ay neden zarar ettim?" }
   */
  @Post('ask')
  async askQuestion(
    @CurrentUser() user: { tenantId: string },
    @Body() dto: AskQuestionDto,
  ) {
    this.logger.log(`Ask AI isteği. TenantID: ${user.tenantId} | Soru: "${dto.question.slice(0, 60)}"`);
    return this.aiInsightsService.askQuestion(user.tenantId, dto.question);
  }
}
