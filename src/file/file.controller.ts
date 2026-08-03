import { Controller, Get, Post, Body, Param, UploadedFile, UseInterceptors, Res, NotFoundException, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { join, extname } from 'path';
import type { Response } from 'express';
import { FileService } from './file.service';
import { File } from './files.entity';
import { TaskSubmissionService } from '../task-submission/task-submission.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/x-m4a', 'audio/aac',
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

@Controller('files')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly taskSubmissionService: TaskSubmissionService,
  ) {}

  @Post()
  create(@Body() body: Partial<File>): Promise<File> {
    return this.fileService.create(body);
  }

  @Get()
  findAll(): Promise<File[]> {
    return this.fileService.findAll();
  }

  @Get('serve/:module/:filename')
  serveFile(
    @Param('module') module: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      // Validate module and filename to prevent path traversal
      if (/[\/\\\.]{2,}/.test(module) || /[\/\\\.]{2,}/.test(filename)) {
        throw new BadRequestException('Invalid file path');
      }
      const safeModule = module.replace(/[^a-zA-Z0-9_-]/g, '');
      const safeFilename = filename.replace(/[^a-zA-Z0-9_.\-]/g, '');

      // Construct the full file path
      const fullPath = join(process.cwd(), 'uploads', safeModule, safeFilename);

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        throw new NotFoundException('File not found');
      }

      // Determine content type based on file extension
      const ext = filename.split('.').pop()?.toLowerCase();
      const contentTypeMap: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'pdf': 'application/pdf',
        'mp4': 'video/mp4',
        'webp': 'image/webp',
      };
      const contentType = contentTypeMap[ext || ''] || 'application/octet-stream';

      // Set headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      // Stream the file
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('File not found');
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<File> {
    return this.fileService.findOne(id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const tempDir = join(process.cwd(), 'uploads', 'temp');
          fs.mkdirSync(tempDir, { recursive: true });
          cb(null, tempDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
          cb(null, `${timestamp}_${safeName}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(new BadRequestException(`File type '${file.mimetype}' is not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() fileData: Express.Multer.File,
    @Body() body: { module: 'event' | 'event_activity' | 'task' | 'comment' | 'task_submission' | 'gallery'; ownerId: string },
  ): Promise<File> {
    const { module, ownerId } = body;

    // Move file from temp to correct module folder
    const targetDir = join(process.cwd(), 'uploads', module ?? 'task');
    fs.mkdirSync(targetDir, { recursive: true });

    const sourcePath = fileData.path;
    const targetPath = join(targetDir, fileData.filename);

    // Move the file
    fs.renameSync(sourcePath, targetPath);

    const relativePath = join(module, fileData.filename).replace(/\\/g, '/');
    const payload: Partial<File> = {
      module,
      file_path: relativePath,
      is_active: true,
      is_deleted: false,
    };
    if (module === 'event') payload.event_id = ownerId;
    else if (module === 'event_activity') payload.event_activity_id = ownerId;
    else if (module === 'comment') payload.comment_id = ownerId;
    else if (module === 'task_submission') payload.task_submission_id = ownerId;
    else if (module === 'gallery') payload.gallery_id = ownerId;
    else payload.task_id = ownerId;
    const uploadedFile = await this.fileService.create(payload);

    // A submission is only real once its file has been persisted. Recording
    // it here means every parent client, including older app builds, creates
    // a distinct reviewable attempt for each uploaded file.
    if (module === 'task_submission') {
      await this.taskSubmissionService.recordAttempt(ownerId, uploadedFile.id);
    }

    return uploadedFile;
  }

  @Get('by/:module/:ownerId')
  findByModule(
    @Param('module') module: 'event' | 'event_activity' | 'task' | 'comment' | 'task_submission' | 'gallery',
    @Param('ownerId') ownerId: string,
  ): Promise<File[]> {
    return this.fileService.findByModuleAndOwner(module, ownerId);
  }
}
