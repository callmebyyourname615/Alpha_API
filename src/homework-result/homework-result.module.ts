import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeworkResult } from './homework-result.entity';
import { HomeworkResultService } from './homework-result.service';
import { HomeworkResultController } from './homework-result.controller';
import { TeacherHomework } from '../teacher-homework/teacher-homework.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HomeworkResult, TeacherHomework])],
  controllers: [HomeworkResultController],
  providers: [HomeworkResultService],
  exports: [HomeworkResultService],
})
export class HomeworkResultModule {}
