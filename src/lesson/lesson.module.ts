import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { Lesson } from './lesson.entity';
import { SubjectType } from '../subject_types/subject-type.entity';
import { YearLevel } from '../year_levels/year-level.entity';
import { Subject } from '../subjects/subject.entity';
import { Curriculum } from '../curriculums/curriculum.entity';
import { SubjectEvaluation } from '../subject_evaluations/subject-evaluation.entity';
import { Evaluation } from '../evaluations/evaluation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lesson,
      SubjectType,
      YearLevel,
      Subject,
      Curriculum,
      SubjectEvaluation,
      Evaluation,
    ]),
  ],
  controllers: [LessonController],
  providers: [LessonService],
  exports: [LessonService],
})
export class LessonModule {}
