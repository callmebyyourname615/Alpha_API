import { Controller, Get, Param } from '@nestjs/common';
import { TaskActivityService } from './task-activity.service';

@Controller('tasks/:taskId/activity')
export class TaskActivityController {
  constructor(private readonly service: TaskActivityService) {}

  @Get()
  getTimeline(@Param('taskId') taskId: string) {
    return this.service.getTimeline(taskId);
  }
}
