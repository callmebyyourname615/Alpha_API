<<<<<<< HEAD
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
=======
import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
>>>>>>> e882894 (a)
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginParentDto } from './dto/login-parent.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
<<<<<<< HEAD
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LoginRateLimitGuard)
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: Request,
  ) {
    try {
      const result = await this.authService.login(body.email, body.password);
      LoginRateLimitGuard.recordSuccess(req, body.email);
      return result;
    } catch (err) {
      LoginRateLimitGuard.recordFailure(req, body.email);
      throw err;
    }
  }

  @Public()
  @UseGuards(LoginRateLimitGuard)
  @Post('parent/login')
  @HttpCode(HttpStatus.OK)
  async loginParent(@Body() dto: LoginParentDto, @Req() req: Request) {
    try {
      const result = await this.authService.loginParent(
        dto.email,
        dto.password,
      );
      LoginRateLimitGuard.recordSuccess(req, dto.email);
      return result;
    } catch (err) {
      LoginRateLimitGuard.recordFailure(req, dto.email);
      throw err;
    }
  }
=======
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('parent/login')
  @HttpCode(HttpStatus.OK)
  async loginParent(@Body() dto: LoginParentDto) {
    return this.authService.loginParent(dto.email, dto.password);
  }
>>>>>>> e882894 (a)

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request) {
    const user = req['user'];
    return this.authService.refreshToken(user);
  }
}
