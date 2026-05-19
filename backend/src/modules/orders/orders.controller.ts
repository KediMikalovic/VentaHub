import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // GET /orders
  @Get()
  findAll(@CurrentUser() user: any) {
    return this.ordersService.findAll(user.tenantId);
  }

  // POST /orders
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.tenantId, dto);
  }

  // PATCH /orders/:id/status
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, user.tenantId, dto);
  }
}
