import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { HomeworkResultService } from './homework-result.service';
import { CreateHomeworkResultDto } from './dto/create-homework-result.dto';
import { BulkCreateHomeworkResultDto } from './dto/bulk-create-homework-result.dto';
import { UpdateHomeworkResultDto } from './dto/update-homework-result.dto';

const ALLOWED_FILE_TYPES = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

@Controller('homework-results')
export class HomeworkResultController {
  constructor(private readonly homeworkResultService: HomeworkResultService) {}

  // POST /homework-results
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const directory = join(process.cwd(), 'uploads', 'homework-results');
          fs.mkdirSync(directory, { recursive: true });
          cb(null, directory);
        },
        filename: (_req, file, cb) => {
          const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(
            null,
            `submission-${suffix}${extname(file.originalname).toLowerCase()}`,
          );
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_FILE_TYPES.includes(ext)) {
          return cb(
            new BadRequestException(
              'Only JPG, PNG, WEBP, and PDF files are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  create(
    @Body() dto: CreateHomeworkResultDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('A homework image is required');
    }
    dto.submissionFile = `uploads/homework-results/${file.filename}`;
    return this.homeworkResultService.create(dto);
  }

  // POST /homework-results/bulk
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  bulkCreate(@Body() dto: BulkCreateHomeworkResultDto) {
    return this.homeworkResultService.bulkCreate(dto);
  }

  // GET /homework-results
  @Get()
  findAll() {
    return this.homeworkResultService.findAll();
  }

  // GET /homework-results/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.homeworkResultService.findOne(id);
  }

  // GET /homework-results/homework/:homeworkId
  @Get('homework/:homeworkId')
  findByHomework(@Param('homeworkId', ParseUUIDPipe) homeworkId: string) {
    return this.homeworkResultService.findByHomework(homeworkId);
  }

  // GET /homework-results/student/:studentId
  @Get('student/:studentId')
  findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.homeworkResultService.findByStudent(studentId);
  }

  // GET /homework-results/class/:classId
  @Get('class/:classId')
  findByClass(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.homeworkResultService.findByClass(classId);
  }

  // PATCH /homework-results/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHomeworkResultDto,
  ) {
    return this.homeworkResultService.update(id, dto);
  }

  // DELETE /homework-results/:id  (soft delete)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.homeworkResultService.remove(id);
  }
}
