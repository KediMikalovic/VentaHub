import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  // Account
  @IsString()
  @MinLength(3)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  // Company
  @IsString()
  @MinLength(2)
  companyName: string;

  @IsString()
  industry: string;

  @IsString()
  storeSize: string;

  // Integration
  @IsOptional()
  @IsString()
  platform?: string;

  @IsString()
  sellerId: string;

  @IsString()
  apiKey: string;

  @IsString()
  apiSecret: string;
}
