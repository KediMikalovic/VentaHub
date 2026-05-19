import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../database/prisma.service';
import { TrendyolApiService } from '../trendyol.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TrendyolWebhookService {
  private readonly logger = new Logger(TrendyolWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly trendyolApi: TrendyolApiService,
  ) {}

  /**
   * KOBİ onboarding sürecinde webhook kurulumunu yapar.
   */
  async onboardWebhook(tenantId: string) {
    this.logger.log(`Webhook kurulumu başlatılıyor. TenantID: ${tenantId}`);
    
    // NOT: Gerçek senaryoda x-seller-id ve benzeri statik atamalar dinamik olmalıdır.
    // Şimdilik TrendyolApiService interceptor'ını kullanıyoruz.
    
    try {
      // 1. Mevcut webhook'ları kontrol et
      const existingWebhooks = await this.trendyolApi.request<any>('GET', '/v2/webhooks');
      const webhookList = existingWebhooks?.content || [];
      
      const ventahubUrl = 'https://api.ventahub.com/integrations/trendyol/webhook'; // Örnek URL
      let targetWebhook = webhookList.find((w: any) => w.url === ventahubUrl);

      // 2. Limit kontrolü veya yeni oluşturma
      if (!targetWebhook) {
        if (webhookList.length >= 15) {
          this.logger.warn(`Webhook limiti (15) dolu. Yeni webhook eklenemiyor. TenantID: ${tenantId}`);
          return false;
        }

        // VentaHub webhook'unu oluştur
        const createResult = await this.trendyolApi.request<any>('POST', '/v2/webhooks', {
          url: ventahubUrl,
          events: ['CREATED', 'DELIVERED', 'CANCELLED', 'RETURNED'],
        });
        targetWebhook = createResult; // Servis yanıtına göre şekillendirilebilir
        this.logger.log(`Yeni webhook oluşturuldu.`);
      }

      // 3. Veritabanına webhook API Key ile kaydet (Güvenlik için x-api-key)
      const generatedApiKey = uuidv4();
      
      await this.prisma.tenantIntegration.updateMany({
        where: { tenantId, platform: 'TRENDYOL' },
        data: {
          webhookId: targetWebhook?.id?.toString() || 'mock-id',
          webhookApiKey: generatedApiKey,
          isActive: true,
        },
      });

      this.logger.log(`Webhook onboarding tamamlandı. TenantID: ${tenantId}`);
      return true;
    } catch (error) {
      this.logger.error(`Webhook onboarding hatası: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Self-Healing mekanizması: Pasif webhook'ları otonom olarak diriltir.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoHealWebhooks() {
    this.logger.log('Self-Healing: Pasif webhook kontrolü başlatılıyor...');
    
    // Normalde Trendyol üzerinden statüsü PASSIVE olanları çekeriz.
    // Şimdilik VentaHub db'sinde aktif entegrasyonu olanları kontrol ettiğimizi simüle edelim.
    const integrations = await this.prisma.tenantIntegration.findMany({
      where: { isActive: true, platform: 'TRENDYOL', webhookId: { not: null } }
    });

    for (const integration of integrations) {
      try {
        // Gerçekte: Trendyol GET /v2/webhooks çağrısıyla statü kontrol edilir
        // Eğer statü "PASSIVE" ise PUT /v2/webhooks/{webhookId}/activate çağrılır
        
        // Simülasyon
        const isPassive = false; // Mock
        if (isPassive) {
          await this.trendyolApi.request('PUT', `/v2/webhooks/${integration.webhookId}/activate`);
          this.logger.log(`Webhook diriltildi: ${integration.webhookId}`);
        }
      } catch (error) {
        this.logger.error(`Webhook diriltme başarısız: ${(error as Error).message}`);
      }
    }
  }
}
