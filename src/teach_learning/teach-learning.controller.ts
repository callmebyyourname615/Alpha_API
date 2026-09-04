import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { TeachLearningService } from './teach-learning.service';
import { CreateTeachLearningDto } from './dto/create-teach-learning.dto';
import { UpdateTeachLearningDto } from './dto/update-teach-learning.dto';
import { GetTeachLearningByDateRangeDto } from './dto/get-teach-learning-by-date-range.dto';

@Controller('teach-learning')
export class TeachLearningController {
  constructor(private readonly teachLearningService: TeachLearningService) {}

  private parseSubjectIds(subjectIds?: string | string[]): string[] {
    const values = Array.isArray(subjectIds) ? subjectIds : [subjectIds || ''];

    return [
      ...new Set(
        values
          .flatMap((value) => String(value || '').split(','))
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];
  }

  @Post()
  create(@Body() createDto: CreateTeachLearningDto) {
    return this.teachLearningService.create(createDto);
  }

  @Get()
  findAll() {
    return this.teachLearningService.findAll();
  }

  @Get('date-range')
  findByDateRange(@Query() query: GetTeachLearningByDateRangeDto) {
    return this.teachLearningService.findByDateRange(
      query.startDate,
      query.endDate,
    );
  }

  @Get('latest-by-subjects')
  findLatestBySubjects(
    @Query('subjectIds') subjectIds?: string | string[],
    @Query('branchId') branchId?: string,
  ) {
    return this.teachLearningService.findLatestBySubjects(
      this.parseSubjectIds(subjectIds),
      branchId,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachLearningService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTeachLearningDto,
  ) {
    return this.teachLearningService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachLearningService.remove(id);
  }
}
