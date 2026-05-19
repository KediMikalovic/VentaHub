import { IsString, IsNumber, IsOptional, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  sku: string;

  @IsString()
  barcode: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  costPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stockQuantity?: number;
}

export class UpdateProductDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stockQuantity?: number;
}

export class UpdateProductPriceDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice: number;
}
