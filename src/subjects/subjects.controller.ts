import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { SubjectService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  // POST /subjects
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectService.create(dto);
  }

  // GET /subjects
  @Get()
  findAll() {
    return this.subjectService.findAll();
  }

  // GET /subjects/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectService.findOne(id);
  }

  // PATCH /subjects/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.subjectService.update(id, dto);
  }

  // DELETE /subjects/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.subjectService.remove(id);
  }
}