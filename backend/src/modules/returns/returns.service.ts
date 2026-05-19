import {
  Injectable, Logger, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateReturnStatusDto, CreateReturnDto } from './dto/return.dto';

const SLA_HOURS     = 36;
const VALID_STATUSES = ['WaitingForApproval', 'Approved', 'Rejected', 'Completed'];

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── GET /returns ───────────────────────────────────────────────────────────
  async findAll(tenantId: string) {
    this.logger.log(`Iade listesi cekiliyor. TenantID: ${tenantId}`);

    const items = await this.prisma.returnItem.findMany({
      where: { orderItem: { order: { tenantId } } },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItem: {
          include: {
            order: {
              select: {
                orderNumber: true, orderDate: true, platform: true,
                returnStatus: true, returnRequestedAt: true,
              },
            },
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });

    const slaThreshold = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000);

    const returns = items.map((r) => {
      const requestedAt  = r.orderItem.order?.returnRequestedAt ?? r.createdAt;
      const isSlaRisk    = new Date(requestedAt) <= slaThreshold;
      const hoursElapsed = Math.floor(
        (Date.now() - new Date(requestedAt).getTime()) / (1000 * 60 * 60),
      );

      return {
        id:              r.id,
        claimId:         r.claimId,
        claimLineItemId: r.claimLineItemId,
        orderNumber:     r.orderItem.order?.orderNumber ?? '—',
        platform:        r.orderItem.order?.platform ?? 'TRENDYOL',
        productName:     r.orderItem.product?.name ?? 'Bilinmiyor',
        productSku:      r.orderItem.product?.sku ?? '—',
        claimItemStatus: r.claimItemStatus,
        customerNote:    r.customerNote,
        requestedAt:     requestedAt.toISOString(),
        hoursElapsed,
        isSlaRisk,
        createdAt:       r.createdAt.toISOString(),
      };
    });

    const slaRiskCount = returns.filter((r) => r.isSlaRisk).length;
    this.logger.log(`${returns.length} iade, ${slaRiskCount} SLA riskli.`);
    return { returns, slaRiskCount };
  }

  // ── GET /returns/stats ─────────────────────────────────────────────────────
  async getStats(tenantId: string) {
    const slaThreshold = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000);

    const [total, slaRisk, byStatus] = await Promise.all([
      this.prisma.returnItem.count({ where: { orderItem: { order: { tenantId } } } }),
      this.prisma.returnItem.count({
        where: { orderItem: { order: { tenantId } }, createdAt: { lte: slaThreshold } },
      }),
      this.prisma.returnItem.groupBy({
        by: ['claimItemStatus'],
        where: { orderItem: { order: { tenantId } } },
        _count: true,
      }),
    ]);

    return {
      total,
      slaRisk,
      byStatus: byStatus.map((s) => ({ status: s.claimItemStatus, count: s._count })),
    };
  }

  // ── PATCH /returns/:id/status ─────────────────────────────────────────────
  async updateStatus(id: string, tenantId: string, dto: UpdateReturnStatusDto) {
    if (!VALID_STATUSES.includes(dto.status)) {
      throw new BadRequestException(
        `Gecersiz durum. Gecerli degerler: ${VALID_STATUSES.join(', ')}`,
      );
    }

    const returnItem = await this.prisma.returnItem.findFirst({
      where: { id, orderItem: { order: { tenantId } } },
    });
    if (!returnItem) throw new NotFoundException('Iade talebi bulunamadi.');

    if (returnItem.claimItemStatus === 'Completed') {
      throw new BadRequestException('Tamamlanmis iade guncellenemez.');
    }

    const updated = await this.prisma.returnItem.update({
      where: { id },
      data:  { claimItemStatus: dto.status },
    });

    this.logger.log(`Iade durumu guncellendi: ${id} → ${dto.status}`);
    return { id: updated.id, claimItemStatus: updated.claimItemStatus };
  }

  // ── POST /returns ──────────────────────────────────────────────────────────
  async create(tenantId: string, dto: CreateReturnDto) {
    // OrderItem bu tenant'a ait mi?
    const orderItem = await this.prisma.orderItem.findFirst({
      where: { id: dto.orderItemId, order: { tenantId } },
      include: { order: { select: { orderNumber: true, status: true } } },
    });

    if (!orderItem) throw new NotFoundException('Siparis kalemi bulunamadi.');

    if (orderItem.order.status !== 'Delivered') {
      throw new BadRequestException('Sadece teslim edilmis siparisler icin iade olusturulabilir.');
    }

    // Ayni kalem icin bekleyen iade var mi?
    const existing = await this.prisma.returnItem.findFirst({
      where: { orderItemId: dto.orderItemId, claimItemStatus: 'WaitingForApproval' },
    });
    if (existing) {
      throw new ConflictException('Bu siparis kalemi icin zaten bekleyen bir iade talebi var.');
    }

    const ts = Date.now();
    const returnItem = await this.prisma.returnItem.create({
      data: {
        orderItemId:     dto.orderItemId,
        claimId:         `CLM-MANUAL-${ts}`,
        claimLineItemId: `CLMLI-MANUAL-${ts}`,
        claimItemStatus: 'WaitingForApproval',
        customerNote:    dto.customerNote ?? null,
      },
    });

    this.logger.log(`Manuel iade olusturuldu: ${returnItem.id} | Siparis: ${orderItem.order.orderNumber}`);
    return returnItem;
  }

  // ── GET /returns/order/:orderNumber — siparis kalemlerini getir ───────────
  async getOrderItems(tenantId: string, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, tenantId, status: 'Delivered' },
      include: {
        items: {
          include: {
            product: { select: { name: true, sku: true } },
            returns: { select: { id: true, claimItemStatus: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Siparis bulunamadi veya teslim edilmemis. Sadece Delivered siparisler iade edilebilir.',
      );
    }

    return {
      orderId:     order.id,
      orderNumber: order.orderNumber,
      items: order.items.map((item) => ({
        id:          item.id,
        productName: item.product?.name ?? 'Bilinmiyor',
        productSku:  item.product?.sku ?? '—',
        quantity:    item.quantity,
        price:       Number(item.price),
        hasActiveReturn: item.returns.some((r) => r.claimItemStatus === 'WaitingForApproval'),
      })),
    };
  }
}
