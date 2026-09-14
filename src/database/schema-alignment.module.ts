import { Global, Module } from '@nestjs/common';
import { SchemaAlignmentService } from './schema-alignment.service';

@Global()
@Module({
  providers: [SchemaAlignmentService],
  exports: [SchemaAlignmentService],
})
export class SchemaAlignmentModule {}
