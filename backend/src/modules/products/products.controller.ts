import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, UpdateProductPriceDto } from './dto/product.dto';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  // GET /products
  @Get()
  findAll(@CurrentUser() user: any) {
    return this.productsService.findAll(user.tenantId);
  }

  // POST /products
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateProductDto) {
    return this.productsService.create(user.tenantId, dto);
  }

  // PATCH /products/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, user.tenantId, dto);
  }

  // PATCH /products/:id/price
  @Patch(':id/price')
  updatePrice(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateProductPriceDto,
  ) {
    return this.productsService.updatePrice(id, user.tenantId, dto);
  }

  // DELETE /products/:id
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.remove(id, user.tenantId);
  }
}
