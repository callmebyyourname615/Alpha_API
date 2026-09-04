import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginParentDto } from './dto/login-parent.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
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

 /* @Post('parent-login')
  async parentLogin(@Body() body: { email: string; password: string }) {
    return this.authService.loginParent(body.email, body.password);
  }*/
}
