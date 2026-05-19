import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { encrypt } from '../../common/utils/crypto.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, tenantId: user.tenantId, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      }
    };
  }

  async register(dto: RegisterDto) {
    this.logger.log(`Kayıt işlemi başlatıldı. Email: ${dto.email}`);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Email Control
        const existingUser = await tx.user.findUnique({ where: { email: dto.email } });
        if (existingUser) {
          throw new BadRequestException('Bu e-posta adresi ile kayıtlı bir hesap zaten var.');
        }

        // 2. Tenant Creation
        const tenant = await tx.tenant.create({
          data: {
            companyName: dto.companyName,
            industry: dto.industry,
            taxInfo: { storeSize: dto.storeSize }, // Ekstra veriyi JSON'da tutuyoruz
          }
        });

        // 3. User Creation (Hash Password)
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await tx.user.create({
          data: {
            tenantId: tenant.id,
            fullName: dto.fullName,
            email: dto.email,
            passwordHash,
            role: 'OWNER',
          }
        });

        // 4. TenantIntegration Creation with AES-256 Envelope Encryption
        const platform = (dto.platform || 'TRENDYOL') as any;
        await tx.tenantIntegration.create({
          data: {
            tenantId: tenant.id,
            platform,
            sellerId: dto.sellerId,
            encryptedApiKey: encrypt(dto.apiKey),
            encryptedApiSecret: encrypt(dto.apiSecret),
            isActive: true,
          }
        });

        return user;
      });

      this.logger.log(`✅ Kayıt başarılı. KOBİ ortamı oluşturuldu. User: ${result.email}`);
      
      // Auto-Login: JWT üretimi
      return this.login(result);
    } catch (error) {
      this.logger.error(`Kayıt sırasında hata: ${(error as Error).message}`);
      throw error;
    }
  }
}
