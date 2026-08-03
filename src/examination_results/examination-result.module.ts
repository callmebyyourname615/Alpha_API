import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExaminationResult } from './examination-result.entity';
import { ExaminationResultService } from './examination-result.service';
import { ExaminationResultController } from './examination-result.controller';
import { Examination } from '../examination/examination.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExaminationResult, Examination])],
  controllers: [ExaminationResultController],
  providers: [ExaminationResultService],
  exports: [ExaminationResultService],
})
export class ExaminationResultModule {}