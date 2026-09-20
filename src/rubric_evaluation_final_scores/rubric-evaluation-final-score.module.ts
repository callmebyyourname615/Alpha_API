import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RubricEvaluationFinalScoreController } from './rubric-evaluation-final-score.controller';
import { RubricEvaluationFinalScore } from './rubric-evaluation-final-score.entity';
import { RubricEvaluationFinalScoreService } from './rubric-evaluation-final-score.service';

@Module({
  imports: [TypeOrmModule.forFeature([RubricEvaluationFinalScore])],
  controllers: [RubricEvaluationFinalScoreController],
  providers: [RubricEvaluationFinalScoreService],
})
export class RubricEvaluationFinalScoreModule {}
