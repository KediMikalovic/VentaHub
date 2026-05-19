import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import pLimit from 'p-limit';

@Injectable()
export class TrendyolApiService {
  private readonly logger = new Logger(TrendyolApiService.name);
  private readonly baseUrl: string;
  private readonly useMock: boolean;

  // p-limit ile maksimum eşzamanlı/saniyedeki istek sayısını sınırlıyoruz.
  // 10 saniyede 50 istek = saniyede ortalama 5 istek.
  private limit = pLimit(5);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.useMock = this.configService.get<string>('USE_MOCK_API') === 'true';
    this.baseUrl = this.configService.get<string>('TRENDYOL_STAGE_URL') || 'https://stageapigw.trendyol.com';

    // Axios Interceptor Kurulumu
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.httpService.axiosRef.interceptors.request.use(
      (config) => {
        // Mock KMS Çözme İşlemi (Normalde KMS servisi çağrılır)
        const mockDecryptedApiKey = config.headers['x-encrypted-api-key'] || 'mock-api-key';
        const mockDecryptedApiSecret = config.headers['x-encrypted-api-secret'] || 'mock-api-secret';
        
        // Şifreleri Base64 yapma (API_KEY:API_SECRET)
        const base64Auth = Buffer.from(`${mockDecryptedApiKey}:${mockDecryptedApiSecret}`).toString('base64');

        // Headers Ataması
        config.headers['Authorization'] = `Basic ${base64Auth}`;
        
        // User-Agent: {Satıcı Id} - VentaHub
        const sellerId = config.headers['x-seller-id'] || '999999';
        config.headers['User-Agent'] = `${sellerId} - VentaHub`;

        // Güvenlik gereği custom geçici headerları sil (Dışarı gitmemesi için)
        delete config.headers['x-encrypted-api-key'];
        delete config.headers['x-encrypted-api-secret'];
        delete config.headers['x-seller-id'];

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    this.httpService.axiosRef.interceptors.response.use(
      (response) => response,
      (error) => {
        // Hata loglarında Authorization header'ını MASKELİYORUZ
        if (error.config && error.config.headers) {
          error.config.headers['Authorization'] = 'Basic [MASKED]';
        }
        
        if (error.response?.status === 429) {
          this.logger.error('🚨 TRENDYOL RATE LIMIT AŞILDI (429)!');
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Throttling mekanizması ile Trendyol'a istek atan core metot.
   */
  async request<T>(method: string, url: string, data?: any, headers?: any): Promise<T> {
    if (this.useMock) {
      this.logger.log(`[MOCK] İstek atıldı: ${method.toUpperCase()} ${url}`);
      return this.getMockResponse(url) as unknown as T;
    }

    return this.limit(async () => {
      // İstekler arası yapay gecikme eklenebilir (Saniyede 5 isteği garanti etmek için ~200ms)
      await new Promise((resolve) => setTimeout(resolve, 200));

      try {
        const response = await firstValueFrom(
          this.httpService.request({
            method,
            url: `${this.baseUrl}${url}`,
            data,
            headers,
          })
        );
        return response.data;
      } catch (error) {
        this.logger.error(`Trendyol API Hatası: ${method} ${url}`, (error as Error).message);
        throw error;
      }
    });
  }

  private getMockResponse(url: string) {
    // Postman koleksiyonuna benzer Mock veriler döndürüyoruz
    if (url.includes('/orders')) {
      return {
        content: [
          { orderNumber: '123456789', status: 'Created', grossAmount: 150.5 },
        ],
      };
    }
    return { success: true, message: 'Mock response' };
  }
}
