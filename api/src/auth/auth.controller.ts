import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 registrations per minute
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.name, dto.email, dto.password, dto.niche);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 login attempts per minute
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}