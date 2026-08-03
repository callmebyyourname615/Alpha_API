import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../task/task.entity';
import { TaskSubmission } from '../task-submission/task-submission.entity';
import { TaskSubmissionAttempt } from '../task-submission/task-submission-attempt.entity';
import { TaskSubmissionSlot } from '../task-submission/task-submission-slot.entity';
import { Comment } from '../comments/comments.entity';
import { Notification } from '../notifications/notification.entity';
import { TaskActivityService } from './task-activity.service';
import { TaskActivityController } from './task-activity.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskSubmission, TaskSubmissionAttempt, TaskSubmissionSlot, Comment, Notification])],
  providers: [TaskActivityService],
  controllers: [TaskActivityController],
})
export class TaskActivityModule {}
