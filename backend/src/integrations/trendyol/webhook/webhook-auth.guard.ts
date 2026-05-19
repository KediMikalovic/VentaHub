import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class WebhookAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const integration = await this.prisma.tenantIntegration.findFirst({
      where: {
        webhookApiKey: apiKey as string,
        isActive: true,
      },
    });

    if (!integration) {
      throw new UnauthorizedException('Invalid or inactive webhook API key');
    }

    // Tenant bilgisini doğrudan request'e ekliyoruz ki Controller'da kullanabilelim
    request.tenantId = integration.tenantId;
    return true;
  }
}
