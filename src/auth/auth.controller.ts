import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginParentDto } from './dto/login-parent.dto';
import { Public } from './public.decorator';
import { LoginRateLimitGuard } from './login-rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LoginRateLimitGuard)
  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Req() req: Request) {
    const clientIp =
      ((req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()) ||
      req.ip ||
      'unknown';
    try {
      const result = await this.authService.login(body.email, body.password);
      LoginRateLimitGuard.recordSuccess(clientIp);
      return result;
    } catch (err) {
      LoginRateLimitGuard.recordFailure(clientIp);
      throw err;
    }
  }

  @Public()
  @UseGuards(LoginRateLimitGuard)
  @Post('parent/login')
  @HttpCode(HttpStatus.OK)
  async loginParent(@Body() dto: LoginParentDto, @Req() req: Request) {
    const clientIp =
      ((req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()) ||
      req.ip ||
      'unknown';
    try {
      const result = await this.authService.loginParent(dto.email, dto.password);
      LoginRateLimitGuard.recordSuccess(clientIp);
      return result;
    } catch (err) {
      LoginRateLimitGuard.recordFailure(clientIp);
      throw err;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request) {
    const user = req['user'];
    return this.authService.refreshToken(user);
  }
}
