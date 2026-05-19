import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateReturnStatusDto {
  @IsString()
  status: string;
}

export class CreateReturnDto {
  @IsUUID()
  orderItemId: string;

  @IsString()
  @IsOptional()
  customerNote?: string;
}
