import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskSubmission } from './task-submission.entity';
import { TaskSubmissionAttempt } from './task-submission-attempt.entity';
import { TaskSubmissionSlot } from './task-submission-slot.entity';
import { Task } from '../task/task.entity';
import { TaskSubmissionService } from './task-submission.service';
import { TaskSubmissionController } from './task-submission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskSubmission, TaskSubmissionAttempt, TaskSubmissionSlot, Task])],
  providers: [TaskSubmissionService],
  controllers: [TaskSubmissionController],
  exports: [TaskSubmissionService],
})
export class TaskSubmissionModule {}
