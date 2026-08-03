import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ExaminationService } from './examination.service';
import { CreateExaminationDto } from './dto/create-examination.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';
import { compressPdf } from '../common/utils/compress-pdf.util';

const MAX_FILE_SIZE = Infinity;

const storage = diskStorage({
  destination: './uploads/examinations',
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}${extname(file.originalname)}`),
});

const fileInterceptorOptions = {
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException(`File type ${file.mimetype} is not allowed`), false);
    }
  },
};

type UploadedExamFiles = {
  exam_file?: Express.Multer.File[];
  answer_file?: Express.Multer.File[];
};

async function compressUploadedPdfs(files: UploadedExamFiles): Promise<void> {
  const allFiles = [...(files.exam_file ?? []), ...(files.answer_file ?? [])];
  for (const file of allFiles) {
    if (file.mimetype === 'application/pdf') {
      await compressPdf(file.path);
    }
  }
}

@Controller('examinations')
export class ExaminationController {
  constructor(private readonly service: ExaminationService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'exam_file', maxCount: 1 }, { name: 'answer_file', maxCount: 1 }],
      fileInterceptorOptions,
    ),
  )
  async create(
    @Body() dto: CreateExaminationDto,
    @UploadedFiles() files: UploadedExamFiles,
  ) {
    await compressUploadedPdfs(files ?? {});
    return this.service.create(dto, files ?? {});
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'exam_file', maxCount: 1 }, { name: 'answer_file', maxCount: 1 }],
      fileInterceptorOptions,
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExaminationDto,
    @UploadedFiles() files: UploadedExamFiles,
  ) {
    await compressUploadedPdfs(files ?? {});
    return this.service.update(id, dto, files ?? {});
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Patch(':id/check')
  check(@Param('id') id: string) {
    return this.service.check(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { comment?: string }) {
    return this.service.reject(id, body?.comment);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
