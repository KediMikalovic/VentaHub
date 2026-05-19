import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { encrypt, decrypt } from '../../common/utils/crypto.util';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    this.logger.log(`Ayarlar ve entegrasyonlar çekiliyor. TenantID: ${tenantId}`);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        integrations: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('KOBİ kaydı bulunamadı.');
    }

    // Entegrasyon şifrelerini UI dostu hale getir (Güvenlik gereği ApiSecret maskelenir)
    const safeIntegrations = tenant.integrations.map((integration) => {
      let decryptedApiKey = '';
      try {
        decryptedApiKey = decrypt(integration.encryptedApiKey);
      } catch (e) {
        decryptedApiKey = '[Çözülemedi]';
      }

      return {
        id: integration.id,
        platform: integration.platform,
        sellerId: integration.sellerId,
        apiKey: decryptedApiKey,
        // Gizlilik ilkesi gereği api secret asla düz metin gönderilmez
        apiSecretMasked: '••••••••••••••••',
        isActive: integration.isActive,
        webhookApiKey: integration.webhookApiKey || 'v-hub_test_secret_key_2026',
        lastSyncAt: integration.lastSyncAt,
      };
    });

    return {
      profile: {
        companyName: tenant.companyName,
        industry: tenant.industry || '',
        subscriptionPlan: tenant.subscriptionPlan,
        status: tenant.status,
        createdAt: tenant.createdAt,
      },
      integrations: safeIntegrations,
    };
  }

  async updateProfile(tenantId: string, data: { companyName?: string; industry?: string }) {
    this.logger.log(`KOBİ profili güncelleniyor. TenantID: ${tenantId}`);

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.companyName && { companyName: data.companyName }),
        ...(data.industry !== undefined && { industry: data.industry }),
      },
    });

    return {
      companyName: updated.companyName,
      industry: updated.industry || '',
      subscriptionPlan: updated.subscriptionPlan,
    };
  }

  async updateIntegration(
    tenantId: string,
    integrationId: string,
    data: { sellerId?: string; apiKey?: string; apiSecret?: string; isActive?: boolean },
  ) {
    this.logger.log(`Entegrasyon güncelleniyor. ID: ${integrationId}`);

    // İlgili entegrasyonun bu tenant'a ait olduğundan emin ol (Veri izolasyonu)
    const existing = await this.prisma.tenantIntegration.findFirst({
      where: { id: integrationId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Entegrasyon kaydı bulunamadı veya yetkiniz yok.');
    }

    const updateData: any = {};
    if (data.sellerId) updateData.sellerId = data.sellerId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    
    // KMS Envelope Encryption Standardı
    if (data.apiKey) updateData.encryptedApiKey = encrypt(data.apiKey);
    if (data.apiSecret) updateData.encryptedApiSecret = encrypt(data.apiSecret);

    const updated = await this.prisma.tenantIntegration.update({
      where: { id: integrationId },
      data: updateData,
    });

    let decryptedApiKey = '';
    try {
      decryptedApiKey = decrypt(updated.encryptedApiKey);
    } catch (e) {
      decryptedApiKey = '';
    }

    return {
      id: updated.id,
      platform: updated.platform,
      sellerId: updated.sellerId,
      apiKey: decryptedApiKey,
      apiSecretMasked: '••••••••••••••••',
      isActive: updated.isActive,
      lastSyncAt: updated.lastSyncAt,
    };
  }
}
