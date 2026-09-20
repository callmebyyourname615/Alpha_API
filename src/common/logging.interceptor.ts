import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly slowRequestMs = Number(
    process.env.SLOW_REQUEST_THRESHOLD_MS ?? '500',
  );

  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const method = req.method;
    const url = req.url;
    const query = req.query;
    const requestId = this.getRequestId(req);
    const start = Date.now();

    req.requestId = requestId;

    if (!this.isProduction) {
      this.logger.log(
        `Incoming Request: ${method} ${url} - RequestId: ${requestId} - Query: ${safeStringify(
          query,
        )}`,
      );
    }

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const statusCode = req.res?.statusCode ?? 0;
        const logLine = `Response: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - RequestId: ${requestId}`;

        if (duration >= this.slowRequestMs) {
          this.logger.warn(`Slow Request: ${logLine}`);
          return;
        }

        this.logger.log(logLine);
      }),
      catchError((err) => {
        const duration = Date.now() - start;
        this.logger.error(
          `Error: ${method} ${url} - Duration: ${duration}ms - RequestId: ${requestId} - ${safeStringify(err?.message ?? err)}`,
        );
        return throwError(() => err);
      }),
    );
  }

  private getRequestId(req: any): string {
    const header = req.headers?.['x-request-id'];
    if (Array.isArray(header)) return header[0] || randomUUID();
    return typeof header === 'string' && header.trim() ? header : randomUUID();
  }
}

// Safe stringify utility
function safeStringify(obj: unknown): string {
  try {
    if (obj === undefined) return '{}';
    return JSON.stringify(obj);
  } catch {
    return '[unserializable object]';
  }
}
