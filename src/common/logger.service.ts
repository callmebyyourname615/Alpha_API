import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { TransformableInfo } from 'logform';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf((info: TransformableInfo) => {
        // ✅ Convert timestamp safely to string
        const timestamp =
          info.timestamp instanceof Date
            ? info.timestamp.toISOString()
            : typeof info.timestamp === 'string'
              ? info.timestamp
              : safeStringify(info.timestamp);

        // ✅ Convert level safely to string
        const level = String(info.level ?? '');

        // ✅ Convert message safely to string
        const message = safeStringify(info.message);

        // ✅ Extract extra metadata
        const meta: Record<string, unknown> = { ...info };
        delete meta.timestamp;
        delete meta.level;
        delete meta.message;

        const metaStr =
          Object.keys(meta).length > 0 ? ` ${safeStringify(meta)}` : '';

        // ✅ Now safe to use in template literal
        return `${timestamp} [${level}]: ${message}${metaStr}`;
      }),
    );

    this.logger = winston.createLogger({
      level: 'info',
      format: logFormat,
      transports: [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });
  }

  log(message: unknown) {
    this.logger.info(safeStringify(message));
  }

  error(message: unknown, trace?: unknown) {
    const traceStr = trace != null ? safeStringify(trace) : '';
    this.logger.error(`${safeStringify(message)} ${traceStr}`);
  }

  warn(message: unknown) {
    this.logger.warn(safeStringify(message));
  }

  debug(message: unknown) {
    this.logger.debug(safeStringify(message));
  }

  verbose(message: unknown) {
    this.logger.verbose(safeStringify(message));
  }
}

// Utility: safely stringify objects to string
function safeStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return '';
  if (typeof obj === 'string') return obj;
  try {
    return JSON.stringify(obj);
  } catch {
    return '[unserializable object]';
  }
}
