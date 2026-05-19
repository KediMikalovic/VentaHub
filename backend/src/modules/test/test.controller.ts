import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TrendyolApiService } from '../../integrations/trendyol/trendyol.service';

@Controller('test')
export class TestController {
  private readonly logger = new Logger(TestController.name);

  constructor(private readonly trendyolService: TrendyolApiService) {}

  @Get('auth-me')
  @UseGuards(JwtAuthGuard)
  getAuthMe(@CurrentUser() user: any) {
    this.logger.log(`Auth testi yapıldı, Tenant: ${user.tenantId}, User: ${user.email}`);
    return {
      message: 'JWT token başarılı şekilde çözüldü ve Guard aşıldı.',
      payload: user,
    };
  }

  @Get('trendyol-burst')
  async testTrendyolBurst() {
    this.logger.log('🚀 Trendyol Burst Testi Başlıyor (Aynı anda 15 istek atılacak)...');
    
    // 15 isteği aynı anda tetikliyoruz (Promise.all)
    const promises = Array.from({ length: 15 }).map(async (_, index) => {
      const reqNumber = index + 1;
      this.logger.debug(`[İstek Sırası: ${reqNumber}] Kuyruğa eklendi. Zaman: ${new Date().toISOString()}`);
      
      const startTime = Date.now();
      
      // TrendyolApiService içindeki p-limit (5) darboğazına takılacak
      await this.trendyolService.request('GET', '/test-burst');
      
      const finishTime = Date.now();
      const timeString = new Date().toISOString();
      this.logger.log(`✅ İstek #${reqNumber} tamamlandı. Bitiş: ${timeString} (Geçen süre: ${finishTime - startTime}ms)`);
      
      return { reqNumber, timestamp: timeString };
    });

    const results = await Promise.all(promises);

    return {
      message: '15 istek tamamlandı. Konsol loglarındaki saniye farklarına bakarak 5 req/sec throttling teyidini yapabilirsiniz.',
      results,
    };
  }
}
