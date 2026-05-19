import { IsString, IsInt, IsOptional, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsString()
  @IsOptional()
  cargoProvider?: string;

  @IsString()
  @IsOptional()
  cargoTrackingNumber?: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  status: string;
}
