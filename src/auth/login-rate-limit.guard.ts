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

// In-memory store for rate limiting login attempts
const loginAttempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 15; // 15 attempts allowed before temporary block
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes window
const BLOCK_DURATION_MS = 3 * 60 * 1000; // 3 minutes temporary block

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (process.env.ENABLE_LOGIN_RATE_LIMIT === 'false') {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const key = LoginRateLimitGuard.buildKey(req);
    const now = Date.now();

    const record = loginAttempts.get(key);

    if (record) {
      // Check if currently blocked
      if (record.blockedUntil && now < record.blockedUntil) {
        const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many failed login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // If block expired or window passed, reset
      if (now - record.firstAttemptAt > WINDOW_MS && !record.blockedUntil) {
        loginAttempts.delete(key);
      }
    }

    return true;
  }

  static buildKey(req: Request, fallbackEmail?: string): string {
    const forwarded = req.headers['x-forwarded-for'];
    let clientIp = 'unknown';
    if (typeof forwarded === 'string') {
      clientIp = forwarded.split(',')[0].trim();
    } else if (req.ip) {
      clientIp = req.ip;
    } else if (req.socket?.remoteAddress) {
      clientIp = req.socket.remoteAddress;
    }

    const email = (
      req.body?.email ||
      fallbackEmail ||
      ''
    ).toLowerCase().trim();

    // If client IP is localhost/internal, distinguish primarily by email to prevent blocking all users on proxy
    if (['127.0.0.1', '::1', 'localhost', 'unknown'].includes(clientIp)) {
      return email ? `acct_${email}` : clientIp;
    }

    // Otherwise combine IP and email so other accounts on the same school IP are not locked out
    return email ? `${clientIp}_${email}` : clientIp;
  }

  // Call this helper when a login fails
  static recordFailure(req: Request, email?: string): void {
    if (process.env.ENABLE_LOGIN_RATE_LIMIT === 'false') return;

    const key = LoginRateLimitGuard.buildKey(req, email);
    const now = Date.now();
    let record = loginAttempts.get(key);

    if (!record || now - record.firstAttemptAt > WINDOW_MS) {
      record = { count: 1, blockedUntil: null, firstAttemptAt: now };
    } else {
      record.count += 1;
      if (record.count >= MAX_ATTEMPTS) {
        record.blockedUntil = now + BLOCK_DURATION_MS;
      }
    }

    loginAttempts.set(key, record);
  }

  // Call this helper when a login succeeds
  static recordSuccess(req: Request, email?: string): void {
    const key = LoginRateLimitGuard.buildKey(req, email);
    loginAttempts.delete(key);
  }

  // Helper to clear all attempts
  static resetAll(): void {
    loginAttempts.clear();
  }
}

