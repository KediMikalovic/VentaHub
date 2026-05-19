import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { TrendyolModule } from './integrations/trendyol/trendyol.module';
import { TrendyolWebhookModule } from './integrations/trendyol/webhook/trendyol-webhook.module';
import { TrendyolCatalogModule } from './integrations/trendyol/catalog/trendyol-catalog.module';
import { TrendyolInventoryModule } from './integrations/trendyol/inventory/trendyol-inventory.module';
import { TrendyolShippingReturnsModule } from './integrations/trendyol/shipping-returns/trendyol-shipping-returns.module';
import { TrendyolFinanceModule } from './integrations/trendyol/finance/trendyol-finance.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AiInsightsModule } from './modules/ai-insights/ai-insights.module';
import { TestController } from './modules/test/test.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    DashboardModule,
    FinanceModule,
    ReturnsModule,
    TrendyolModule,
    TrendyolWebhookModule,
    TrendyolCatalogModule,
    TrendyolInventoryModule,
    TrendyolShippingReturnsModule,
    TrendyolFinanceModule,
    SettingsModule,
    AiInsightsModule,
  ],
  controllers: [TestController],
  providers: [],
})
export class AppModule {}
