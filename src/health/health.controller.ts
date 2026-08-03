import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LoggerService } from '../common/logger.service'; // adjust path

@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: LoggerService, // inject custom logger
  ) {}

  @Get()
  async check() {
    let databaseStatus = 'ok';
    try {
      await this.dataSource.query('SELECT 1');
    } catch (err) {
      this.logger.error('Database health check failed', err);
      databaseStatus = 'error';
    }

    return {
      status: 'ok',
      database: databaseStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(), // seconds
    };
  }
}
