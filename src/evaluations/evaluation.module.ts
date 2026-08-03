import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { Evaluation } from './evaluation.entity';
import { SubjectEvaluation } from '../subject_evaluations/subject-evaluation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evaluation, SubjectEvaluation]), // ✅ เพิ่ม SubjectEvaluation
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule {}