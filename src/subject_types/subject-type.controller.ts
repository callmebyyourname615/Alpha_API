import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,        // ← Important change
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { SubjectTypeService } from './subject-type.service';
import { CreateSubjectTypeDto } from './dto/create-subject-type.dto';
import { UpdateSubjectTypeDto } from './dto/update-subject-type.dto';

@Controller('subject-type')   // ← Recommended: plural
export class SubjectTypeController {

  constructor(private readonly subjectService: SubjectTypeService) {}

  @Post()
  create(@Body() createDto: CreateSubjectTypeDto) {
    return this.subjectService.create(createDto);
  }

  @Get()
  findAll() {
    return this.subjectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {   // ← Fixed
    return this.subjectService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,           // ← Fixed
    @Body() updateDto: UpdateSubjectTypeDto,
  ) {
    return this.subjectService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {    // ← Fixed
    return this.subjectService.remove(id);
  }
}