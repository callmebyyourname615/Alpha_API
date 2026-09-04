import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

interface AttemptRecord {
  count: number;
  blockedUntil: number | null;
  firstAttemptAt: number;
}

// In-memory store for rate limiting login attempts by IP
const loginAttempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5; // Max 5 attempts
const WINDOW_MS = 5 * 60 * 1000; // Within 5 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // Block for 15 minutes if exceeded

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const clientIp = this.getClientIp(req);
    const now = Date.now();

    const record = loginAttempts.get(clientIp);

    if (record) {
      // Check if currently blocked
      if (record.blockedUntil && now < record.blockedUntil) {
        const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many failed login attempts. Please try again in ${remainingMinutes} minutes.`,
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // If block expired or window passed, reset
      if (now - record.firstAttemptAt > WINDOW_MS && !record.blockedUntil) {
        loginAttempts.delete(clientIp);
      }
    }

    return true;
  }

  // Call this helper when a login fails
  static recordFailure(clientIp: string): void {
    const now = Date.now();
    let record = loginAttempts.get(clientIp);

    if (!record || now - record.firstAttemptAt > WINDOW_MS) {
      record = { count: 1, blockedUntil: null, firstAttemptAt: now };
    } else {
      record.count += 1;
      if (record.count >= MAX_ATTEMPTS) {
        record.blockedUntil = now + BLOCK_DURATION_MS;
      }
    }

    loginAttempts.set(clientIp, record);
  }

  // Call this helper when a login succeeds
  static recordSuccess(clientIp: string): void {
    loginAttempts.delete(clientIp);
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}

