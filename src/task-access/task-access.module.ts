import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../task/task.entity';
import { Class } from '../classes/class.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { TaskAccessService } from './task-access.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Class, Enrollment])],
  providers: [TaskAccessService],
  exports: [TaskAccessService],
})
export class TaskAccessModule {}
