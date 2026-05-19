import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReturnsService } from './returns.service';
import { UpdateReturnStatusDto, CreateReturnDto } from './dto/return.dto';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  // GET /returns
  @Get()
  findAll(@CurrentUser() user: any) {
    return this.returnsService.findAll(user.tenantId);
  }

  // GET /returns/stats
  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.returnsService.getStats(user.tenantId);
  }

  // GET /returns/order/:orderNumber — iade formu icin siparis kalemlerini getir
  @Get('order/:orderNumber')
  getOrderItems(
    @Param('orderNumber') orderNumber: string,
    @CurrentUser() user: any,
  ) {
    return this.returnsService.getOrderItems(user.tenantId, orderNumber);
  }

  // POST /returns
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateReturnDto) {
    return this.returnsService.create(user.tenantId, dto);
  }

  // PATCH /returns/:id/status
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateReturnStatusDto,
  ) {
    return this.returnsService.updateStatus(id, user.tenantId, dto);
  }
}
