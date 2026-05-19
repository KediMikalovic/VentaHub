import { Module } from '@nestjs/common';
import { AiInsightsController } from './ai-insights.controller';
import { AiInsightsService } from './ai-insights.service';
import { GoogleAiModule } from '../../integrations/google-ai/google-ai.module';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [
    PrismaModule,      // Veritabanı erişimi
    GoogleAiModule,    // GeminiService (ve ileride NlApiService)
  ],
  controllers: [AiInsightsController],
  providers: [AiInsightsService],
})
export class AiInsightsModule {}
