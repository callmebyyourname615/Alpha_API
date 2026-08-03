import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TaskSubmissionService } from './task-submission.service';
import { UpsertTaskSubmissionDto } from './dto/create-task-submission.dto';
import { UpdateTaskSubmissionDto } from './dto/update-task-submission.dto';
import { CreateTaskSubmissionAttemptDto } from './dto/create-task-submission-attempt.dto';
import { ReviewTaskSlotDto, SubmitTaskSlotDto, SyncTaskSlotsDto } from './dto/task-submission-slot.dto';

@Controller('task-submissions')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TaskSubmissionController {
  constructor(private readonly service: TaskSubmissionService) {}

  @Get()
  findByTask(@Query('task_id') taskId: string) {
    return this.service.findByTask(taskId);
  }

  @Get('attempts')
  findAttemptsByTask(@Query('task_id') taskId: string) {
    return this.service.findAttemptsByTask(taskId);
  }

  @Get('slots/tracking')
  findSlots(@Query('task_id') taskId: string, @Query('student_id') studentId?: string) {
    return this.service.findSlots(taskId, studentId);
  }

  @Post('slots/sync')
  syncSlots(@Body() dto: SyncTaskSlotsDto) {
    return this.service.syncSlots(dto.task_id, dto.student_ids);
  }

  @Post('slots/submit')
  submitSlot(@Body() dto: SubmitTaskSlotDto) {
    return this.service.submitSlot(dto);
  }

  @Post('slots/review')
  reviewSlot(@Body() dto: ReviewTaskSlotDto) {
    return this.service.reviewSlot(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  upsert(@Body() dto: UpsertTaskSubmissionDto) {
    return this.service.upsert(dto);
  }

  @Post(':id/attempts')
  recordAttempt(@Param('id') id: string, @Body() dto: CreateTaskSubmissionAttemptDto) {
    return this.service.recordAttempt(id, dto.file_id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskSubmissionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
