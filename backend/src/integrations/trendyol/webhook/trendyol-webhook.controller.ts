import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../../../common/constants/queue.constants';
import { WebhookAuthGuard } from './webhook-auth.guard';

@Controller('integrations/trendyol/webhook')
export class TrendyolWebhookController {
  private readonly logger = new Logger(TrendyolWebhookController.name);

  constructor(
    @InjectQueue(QUEUES.ORDER_INGESTION) private readonly orderIngestionQueue: Queue,
  ) {}

  @Post()
  @UseGuards(WebhookAuthGuard)
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: any, @Body() payload: any) {
    const tenantId = req.tenantId;

    // Fast ACK: Veritabanı işlemi yapmadan anında kuyruğa basıyoruz
    await this.orderIngestionQueue.add('process_order', {
      tenantId,
      payload,
    });

    this.logger.debug(`Webhook payload kuyruğa eklendi. TenantID: ${tenantId}`);

    // Timeout yememek için Trendyol'a derhal 200 OK dönüyoruz
    return { success: true };
  }
}
