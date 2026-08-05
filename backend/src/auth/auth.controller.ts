import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { CheckEmailDto } from './dto/check-email.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Limites apertados nas rotas sensíveis a brute-force / enumeração de e-mail.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('google')
  loginWithGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto);
  }

  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Get('check-email')
  checkEmail(@Query() query: CheckEmailDto) {
    return this.authService.checkEmail(query.email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(user.id, dto);
  }

  @Patch('me/onboarding')
  @UseGuards(JwtAuthGuard)
  completeOnboarding(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.completeOnboarding(user.id);
  }
}
