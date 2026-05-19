import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: Record<string, any>) {
    const user = await this.authService.validateUser(signInDto.email, signInDto.password);
    if (!user) {
      throw new UnauthorizedException('Geçersiz email veya şifre');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    // Public route: JwtAuthGuard tarafından korunmaz.
    return this.authService.register(registerDto);
  }
}
