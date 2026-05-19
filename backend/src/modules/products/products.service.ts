import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto, UpdateProductDto, UpdateProductPriceDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── GET /products ──────────────────────────────────────────────────────────
  async findAll(tenantId: string) {
    this.logger.log(`Urun listesi cekiliyor. TenantID: ${tenantId}`);
    const products = await this.prisma.product.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    this.logger.log(`${products.length} urun donduruluyur.`);
    return { products };
  }

  // ── POST /products ─────────────────────────────────────────────────────────
  async create(tenantId: string, dto: CreateProductDto) {
    this.logger.log(`Yeni urun olusturuluyor. TenantID: ${tenantId}, SKU: ${dto.sku}`);

    const existing = await this.prisma.product.findFirst({
      where: { tenantId, barcode: dto.barcode },
    });
    if (existing) {
      throw new ConflictException(`Bu barkoda sahip bir urun zaten mevcut: ${dto.barcode}`);
    }

    const product = await this.prisma.product.create({
      data: {
        tenantId,
        name: dto.name,
        sku: dto.sku,
        barcode: dto.barcode,
        salePrice: dto.salePrice,
        costPrice: dto.costPrice ?? 0,
        stockQuantity: dto.stockQuantity ?? 0,
        source: 'MANUAL',
      },
    });

    this.logger.log(`Urun olusturuldu: ${product.name} (${product.id})`);
    return product;
  }

  // ── PATCH /products/:id ────────────────────────────────────────────────────
  async update(id: string, tenantId: string, dto: UpdateProductDto) {
    this.logger.log(`Urun guncelleniyor. ID: ${id}`);

    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException("Urun bulunamadi veya bu tenant'a ait degil.");
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.barcode !== undefined && { barcode: dto.barcode }),
        ...(dto.stockQuantity !== undefined && { stockQuantity: dto.stockQuantity }),
      },
    });

    this.logger.log(`Urun guncellendi: ${updated.name}`);
    return updated;
  }

  // ── PATCH /products/:id/price ──────────────────────────────────────────────
  async updatePrice(id: string, tenantId: string, dto: UpdateProductPriceDto) {
    this.logger.log(`Fiyat guncelleniyor. ID: ${id}`);

    if (dto.salePrice !== undefined && dto.costPrice !== undefined && dto.salePrice < dto.costPrice) {
      throw new BadRequestException('Satis fiyati alis fiyatindan dusuk olamaz.');
    }

    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException("Urun bulunamadi veya bu tenant'a ait degil.");
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { costPrice: dto.costPrice, salePrice: dto.salePrice },
    });

    this.logger.log(`Fiyat guncellendi: ${updated.name}`);
    return updated;
  }

  // ── DELETE /products/:id ───────────────────────────────────────────────────
  async remove(id: string, tenantId: string) {
    this.logger.log(`Urun siliniyor. ID: ${id}`);

    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException("Urun bulunamadi veya bu tenant'a ait degil.");
    }

    // Siparis kalemlerinde kullanilanlar silinemez
    const usedInOrders = await this.prisma.orderItem.count({ where: { productId: id } });
    if (usedInOrders > 0) {
      throw new BadRequestException(
        `Bu urun ${usedInOrders} siparis kaleminde kullaniliyor. Silmeden once siparisleri kaldirin.`,
      );
    }

    await this.prisma.product.delete({ where: { id } });
    this.logger.log(`Urun silindi: ${existing.name}`);
    return { message: `"${existing.name}" basariyla silindi.` };
  }
}
