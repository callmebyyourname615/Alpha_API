import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing. Please log in.');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'MY_SUPER_SECRET_KEY',
      });
      request['user'] = payload;

      // Sliding session: If token has less than 60 minutes remaining, automatically
      // generate a renewed token and send it back via response header 'X-Refreshed-Token'
      if (payload && payload.exp) {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const remainingSeconds = payload.exp - nowInSeconds;

        if (remainingSeconds > 0 && remainingSeconds < 60 * 60) {
          const { exp, iat, nbf, ...cleanPayload } = payload;
          const refreshedToken = await this.jwtService.signAsync(cleanPayload);
          const response = context.switchToHttp().getResponse();
          if (response && typeof response.setHeader === 'function') {
            response.setHeader('X-Refreshed-Token', refreshedToken);
            response.setHeader('Access-Control-Expose-Headers', 'X-Refreshed-Token');
          }
        }
      }
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token. Please log in again.');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return undefined;
    }
    const [type, token] = authorization.split(' ');
    return type?.toLowerCase() === 'bearer' ? token : undefined;
  }
}

