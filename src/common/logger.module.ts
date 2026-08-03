// logger.module.ts
import { Global, Module } from '@nestjs/common'; // adjust path
import { LoggerService } from './logger.service';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
