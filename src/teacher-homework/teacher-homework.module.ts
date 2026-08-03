import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherHomework } from './teacher-homework.entity';
import { TeacherHomeworkItem } from './teacher-homework-item.entity';
import { TeacherHomeworkService } from './teacher-homework.service';
import { TeacherHomeworkController } from './teacher-homework.controller';
import { TeachLearning } from '../teach_learning/teach-learning.entity';
import { Teaching } from '../teachings/teaching.entity';
import { Class } from '../classes/class.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeacherHomework,
      TeacherHomeworkItem,
      TeachLearning,
      Teaching,
      Class,
    ]),
  ],
  controllers: [TeacherHomeworkController],
  providers: [TeacherHomeworkService],
  exports: [TeacherHomeworkService],
})
export class TeacherHomeworkModule {}