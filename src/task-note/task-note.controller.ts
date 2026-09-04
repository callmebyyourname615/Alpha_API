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
import { TaskNoteService } from './task-note.service';
import { CreateTaskNoteDto } from './dto/create-task-note.dto';
import { UpdateTaskNoteDto } from './dto/update-task-note.dto';

@Controller('task-notes')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TaskNoteController {
  constructor(private readonly service: TaskNoteService) {}

  @Get()
  findForAdmin(@Query('task_id') taskId: string, @Query('admin_id') adminId: string) {
    return this.service.findForAdmin(taskId, adminId);
  }

  @Post()
  create(@Body() dto: CreateTaskNoteDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskNoteDto, @Query('admin_id') adminId?: string) {
    return this.service.update(id, dto, adminId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('admin_id') adminId?: string) {
    return this.service.delete(id, adminId);
  }
}
