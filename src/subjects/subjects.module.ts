// subjects.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Subject } from './subject.entity';
import { Lesson } from '../lesson/lesson.entity';        // ← add
import { Curriculum } from '../curriculums/curriculum.entity';
import { SubjectType } from '../subject_types/subject-type.entity';
import { Class } from '../classes/class.entity';
import { YearLevel } from '../year_levels/year-level.entity';

import { SubjectController } from './subjects.controller';
import { SubjectService } from './subjects.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subject,
      Lesson,       // ← add this
      Curriculum,
      SubjectType,
      Class,
      YearLevel,
    ]),
  ],
  controllers: [SubjectController],
  providers: [SubjectService],
  exports: [SubjectService],
})
export class SubjectModule {}