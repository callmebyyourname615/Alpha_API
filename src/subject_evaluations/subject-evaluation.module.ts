import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectEvaluation } from './subject-evaluation.entity';
import { SubjectEvaluationService } from './subject-evaluation.service';
import { SubjectEvaluationController } from './subject-evaluation.controller';
import { Subject } from '../subjects/subject.entity';
import { Evaluation } from '../evaluations/evaluation.entity';
import { Admin } from '../admins/admin.entity';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import { Branch } from '../branches/branch.entity';
import { Lesson } from '../lesson/lesson.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubjectEvaluation,
      Subject,
      Evaluation,
      Admin,
      Student,
      Class,
      Branch,
      Lesson,
    ]),
  ],
  providers: [SubjectEvaluationService],
  controllers: [SubjectEvaluationController],
})
export class SubjectEvaluationModule {}