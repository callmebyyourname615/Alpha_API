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
} from '@nestjs/common';
import { ExaminationResultService } from './examination-result.service';
import { CreateExaminationResultDto } from './dto/create-examination-result.dto';
import { BulkCreateExaminationResultDto } from './dto/bulk-create-examination-result.dto';
import { UpdateExaminationResultDto } from './dto/update-examination-result.dto';

@Controller('examination-results')
export class ExaminationResultController {
  constructor(
    private readonly examinationResultService: ExaminationResultService,
  ) {}

  // POST /examination-results
  // Single score entry
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateExaminationResultDto) {
    return this.examinationResultService.create(dto);
  }

  // POST /examination-results/bulk
  // Teacher submits all student scores for one exam at once
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  bulkCreate(@Body() dto: BulkCreateExaminationResultDto) {
    return this.examinationResultService.bulkCreate(dto);
  }

  // GET /examination-results
  @Get()
  findAll() {
    return this.examinationResultService.findAll();
  }

  // GET /examination-results/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.examinationResultService.findOne(id);
  }

  // GET /examination-results/examination/:examinationId
  // All student scores for a specific exam
  @Get('examination/:examinationId')
  findByExamination(
    @Param('examinationId', ParseUUIDPipe) examinationId: string,
  ) {
    return this.examinationResultService.findByExamination(examinationId);
  }

  // GET /examination-results/student/:studentId
  // All exam results for a specific student
  @Get('student/:studentId')
  findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.examinationResultService.findByStudent(studentId);
  }

  // PATCH /examination-results/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExaminationResultDto,
  ) {
    return this.examinationResultService.update(id, dto);
  }

  // DELETE /examination-results/:id  (soft delete)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.examinationResultService.remove(id);
  }
}