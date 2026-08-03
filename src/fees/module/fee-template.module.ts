import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeTemplate } from '../entities/fee-template.entity';
import { FeeTemplateService } from '../service/fee-template.service';
import { FeeTemplateController } from '../controller/fee-template.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FeeTemplate])],
  controllers: [FeeTemplateController],
  providers: [FeeTemplateService],
  exports: [FeeTemplateService],
})
export class FeeTemplateModule {}