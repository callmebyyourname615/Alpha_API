import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

const storage = diskStorage({
  destination: './uploads/lessons',
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}${extname(file.originalname)}`),
});

type LessonBody = Record<string, unknown>;

@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 's_file', maxCount: 1 },
        { name: 't_file', maxCount: 1 },
        { name: 'e_file', maxCount: 1 },
      ],
      { storage },
    ),
  )
  create(
    @Body() body: LessonBody,
    @UploadedFiles()
    files: {
      s_file?: Express.Multer.File[];
      t_file?: Express.Multer.File[];
      e_file?: Express.Multer.File[];
    },
  ) {
    const dto = this.normalizeLessonBody(body) as CreateLessonDto;
    return this.lessonService.create(dto, files ?? {});
  }

  @Get()
  findAll(
    @Query('subjectTypeId') subjectTypeId?: string,
    @Query('yearLevelId') yearLevelId?: string,
    @Query('curriculumId') curriculumId?: string,
  ) {
    return this.lessonService.findAll(subjectTypeId, yearLevelId, curriculumId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 's_file', maxCount: 1 },
        { name: 't_file', maxCount: 1 },
        { name: 'e_file', maxCount: 1 },
      ],
      { storage },
    ),
  )
  update(
    @Param('id') id: string,
    @Body() body: LessonBody,
    @UploadedFiles()
    files: {
      s_file?: Express.Multer.File[];
      t_file?: Express.Multer.File[];
      e_file?: Express.Multer.File[];
    },
  ) {
    const dto = this.normalizeLessonBody(body) as UpdateLessonDto;
    return this.lessonService.update(id, dto, files ?? {});
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lessonService.remove(id);
  }

  private normalizeLessonBody(body: LessonBody): CreateLessonDto | UpdateLessonDto {
    const normalized: Record<string, unknown> = { ...body };
    const subjectId = this.pickFirstString(body.subjectId, body.subject_id);
    const subjectTypeId = this.pickFirstString(body.subjectTypeId, body.subject_type_id);
    const yearLevelId = this.pickFirstString(body.yearLevelId, body.year_level_id);
    const { ids, provided } = this.extractCurriculumIds(body);

    if (subjectId) {
      normalized.subjectId = subjectId;
    }

    if (subjectTypeId) {
      normalized.subjectTypeId = subjectTypeId;
    }

    if (yearLevelId) {
      normalized.yearLevelId = yearLevelId;
    }

    if (provided) {
      normalized.curriculumIds = ids;
    }

    return normalized as CreateLessonDto | UpdateLessonDto;
  }

  private extractCurriculumIds(body: LessonBody): { ids: string[]; provided: boolean } {
    const collected = new Set<string>();
    let provided = false;

    const append = (value: unknown): void => {
      if (Array.isArray(value)) {
        for (const item of value) append(item);
        return;
      }

      if (typeof value !== 'string') return;

      const trimmed = value.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          append(parsed);
          return;
        } catch {
          // fall through and treat as a single string
        }
      }

      collected.add(trimmed);
    };

    for (const key of [
      'curriculumIds',
      'curriculumIds[]',
      'curriculumIds_json',
      'curriculum_ids',
      'curriculum_ids[]',
      'curriculum_ids_json',
      'curriculums',
      'curriculums[]',
      'curriculums_json',
    ]) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        provided = true;
        append(body[key]);
      }
    }

    const indexedKeys = Object.keys(body)
      .filter((key) => /^(curriculumIds|curriculum_ids|curriculums)\[\d+\]$/.test(key))
      .sort((a, b) => Number(a.match(/\d+/)?.[0] ?? 0) - Number(b.match(/\d+/)?.[0] ?? 0));

    if (indexedKeys.length) {
      provided = true;
      for (const key of indexedKeys) {
        append(body[key]);
      }
    }

    return {
      ids: [...collected],
      provided,
    };
  }

  private pickFirstString(...values: unknown[]): string | undefined {
    for (const value of values) {
      if (typeof value !== 'string') continue;
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }

    return undefined;
  }
}
