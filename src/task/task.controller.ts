import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Req,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { TaskService } from './task.service';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/CreateTaskDto';
import { UpdateTaskDto } from './dto/UpdateTaskDto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import type { Request } from 'express';

// With multipart requests class-transformer can instantiate a nested DTO
// before its JSON field is parsed, leaving `settings` as `{}`. Keep the raw
// field available and restore the parsed object before it reaches the service.
function restoreMultipartSettings<T extends { settings?: unknown }>(data: T, rawBody: any): T {
  const raw = rawBody?.settings;
  if (typeof raw !== 'string') return data;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') data.settings = parsed;
  } catch {
    // Validation/service will handle malformed input as before.
  }
  return data;
}

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // ใช้ FilesInterceptor สำหรับ multipart form-data
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/tasks',
        filename: (req, file, cb) => {
          const filename = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
      fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.mp4', '.webm'];
        const ext = extname(file.originalname).toLowerCase();
        if (!allowed.includes(ext)) {
          return cb(new BadRequestException(`File type '${ext}' not allowed.`), false);
        }
        cb(null, true);
      },
    }),
  )
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  )
  create(
    @Body() data: CreateTaskDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() request: Request,
  ) {
    return this.taskService.create(restoreMultipartSettings(data, request.body), files);
  }

  @Get()
  findAll(): Promise<Task[]> {
    return this.taskService.findAll();
  }

  @Get('workload')
  getAllWorkload() {
    return this.taskService.getWorkload();
  }

  @Get(':id/workload')
  getWorkload(@Param('id') id: string) {
    return this.taskService.getWorkload(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Task> {
    return this.taskService.findOne(id);
  }

  @Post(':id')
  findOnebyId(@Param('id') id: string): Promise<Task> {
    return this.taskService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.taskService.delete(id);
  }

  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/tasks',
        filename: (req, file, cb) => {
          const filename = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
      fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.mp4', '.webm'];
        const ext = extname(file.originalname).toLowerCase();
        if (!allowed.includes(ext)) {
          return cb(new BadRequestException(`File type '${ext}' not allowed.`), false);
        }
        cb(null, true);
      },
    }),
  )
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  )
  update(
    @Param('id') id: string,
    @Body() data: UpdateTaskDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() request: Request,
  ): Promise<Task> {
    return this.taskService.update(id, restoreMultipartSettings(data, request.body), files);
  }
}
