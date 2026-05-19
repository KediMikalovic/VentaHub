import {
  Injectable, Logger, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

const VALID_STATUSES  = ['Created', 'Picking', 'Shipped', 'Delivered', 'Cancelled'];
const COMMISSION_RATE = 16; // % varsayilan komisyon orani
const SHIPPING_COST   = 34.90;

function generateOrderNumber(): string {
  const now = new Date();
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const dd  = String(now.getDate()).padStart(2, '0');
  const rnd = String(Math.floor(Math.random() * 900) + 100); // 3 haneli rastgele
  return `TY-${now.getFullYear()}${mm}${dd}-M${rnd}`;        // M = Manuel
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── GET /orders ────────────────────────────────────────────────────────────
  async findAll(tenantId: string) {
    this.logger.log(`Siparis listesi cekiliyor. TenantID: ${tenantId}`);

    const orders = await this.prisma.order.findMany({
      where: { tenantId },
      orderBy: { orderDate: 'desc' },
      include: { items: { select: { price: true, quantity: true } } },
    });

    const mapped = orders.map((o) => {
      const totalAmount = o.items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity, 0,
      );
      return {
        id:            o.id,
        orderNumber:   o.orderNumber,
        customerName:  'Trendyol Müsterisi',
        date:          o.orderDate.toISOString().split('T')[0],
        totalAmount:   parseFloat(totalAmount.toFixed(2)),
        status:        o.status,
        cargoProvider: o.cargoProvider ?? 'Belirtilmemis',
        source:        o.source,
      };
    });

    this.logger.log(`${mapped.length} siparis donduruluyur.`);
    return { orders: mapped };
  }

  // ── POST /orders ───────────────────────────────────────────────────────────
  async create(tenantId: string, dto: CreateOrderDto) {
    this.logger.log(`Manuel siparis olusturuluyor. TenantID: ${tenantId}`);

    // Urun kontrolu
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, tenantId },
    });
    if (!product) throw new NotFoundException('Urun bulunamadi.');

    // Stok kontrolu
    if (product.stockQuantity < dto.quantity) {
      throw new BadRequestException(
        `Yetersiz stok. Mevcut: ${product.stockQuantity}, Talep edilen: ${dto.quantity}`,
      );
    }

    const price         = Number(product.salePrice);
    const commissionAmt = parseFloat((price * dto.quantity * COMMISSION_RATE / 100).toFixed(2));
    const netProfit     = parseFloat((price * dto.quantity - commissionAmt - SHIPPING_COST).toFixed(2));
    const sellerRevenue = parseFloat((price * dto.quantity).toFixed(2));
    const orderNumber   = generateOrderNumber();

    // Transaction: siparis + stok azaltma
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tenantId,
          orderNumber,
          status:             'Created',
          source:             'MANUAL',
          platform:           'TRENDYOL',
          orderDate:          new Date(),
          cargoProvider:       dto.cargoProvider ?? null,
          cargoTrackingNumber: dto.cargoTrackingNumber ?? null,
          items: {
            create: {
              productId:        product.id,
              quantity:         dto.quantity,
              price:            price,
              commissionRate:   COMMISSION_RATE,
              commissionAmount: commissionAmt,
              shippingCost:     SHIPPING_COST,
              netProfit,
            },
          },
          financialLedger: {
            create: {
              tenantId,
              transactionId:       `TXN-${orderNumber}`,
              sellerRevenue,
              commissionAmount:    commissionAmt,
              cargoExpense:        SHIPPING_COST,
              netProfit,
              settlementStatus:    'PENDING',
              expectedPaymentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
          },
        },
        include: { items: { select: { price: true, quantity: true } } },
      });

      // Stok azalt
      await tx.product.update({
        where: { id: product.id },
        data:  { stockQuantity: { decrement: dto.quantity } },
      });

      return newOrder;
    });

    this.logger.log(`Manuel siparis olusturuldu: ${order.orderNumber}`);
    const totalAmount = order.items.reduce(
      (sum, i) => sum + Number(i.price) * i.quantity, 0,
    );
    return {
      id:            order.id,
      orderNumber:   order.orderNumber,
      customerName:  'Manuel Siparis',
      date:          order.orderDate.toISOString().split('T')[0],
      totalAmount:   parseFloat(totalAmount.toFixed(2)),
      status:        order.status,
      cargoProvider: order.cargoProvider ?? 'Belirtilmemis',
      source:        order.source,
    };
  }

  // ── PATCH /orders/:id/status ───────────────────────────────────────────────
  async updateStatus(id: string, tenantId: string, dto: UpdateOrderStatusDto) {
    const status = dto.status;

    if (!VALID_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Gecersiz durum. Gecerli degerler: ${VALID_STATUSES.join(', ')}`,
      );
    }

    const order = await this.prisma.order.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Siparis bulunamadi.');

    if (order.status === 'Delivered') {
      throw new BadRequestException('Teslim edilmis siparisin durumu degistirilemez.');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
    });

    this.logger.log(`Siparis durumu guncellendi: ${updated.orderNumber} → ${status}`);
    return { id: updated.id, orderNumber: updated.orderNumber, status: updated.status };
  }
}
