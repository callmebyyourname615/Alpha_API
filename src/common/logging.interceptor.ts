import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const method = req.method;
    const url = req.url;
    const headers = req.headers;
    const query = req.query;
    const body = req.body;

    const start = Date.now();

    // Log incoming request: body, query, headers
    this.logger.log(
      `Incoming Request: ${method} ${url} - Body: ${safeStringify(
        body,
      )} - Query: ${safeStringify(query)} - Headers: ${safeStringify(headers)}`,
    );

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - start;
        const statusCode = req.res?.statusCode ?? 0;

        this.logger.log(
          `Response: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - Body: ${safeStringify(
            response,
          )}`,
        );
      }),
      catchError((err) => {
        const duration = Date.now() - start;
        this.logger.error(
          `Error: ${method} ${url} - Duration: ${duration}ms - ${safeStringify(err?.message ?? err)}`,
        );
        return throwError(() => err);
      }),
    );
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
