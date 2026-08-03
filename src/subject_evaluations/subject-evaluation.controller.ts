import { Controller, Post, Get, Param, Put, Delete, Body } from '@nestjs/common';
import { SubjectEvaluationService } from './subject-evaluation.service';
import { CreateSubjectEvaluationDto } from './dto/create-subject-evaluation.dto';
import { UpdateSubjectEvaluationDto } from './dto/update-subject-evaluation.dto';
import { SubjectEvaluation } from './subject-evaluation.entity';

@Controller('subject-evaluations')
export class SubjectEvaluationController {
  constructor(private readonly evalService: SubjectEvaluationService) {}

  @Post()
  create(@Body() dto: CreateSubjectEvaluationDto): Promise<SubjectEvaluation> {
    return this.evalService.create(dto);
  }

  @Get()
  findAll(): Promise<SubjectEvaluation[]> {
    return this.evalService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<SubjectEvaluation> {
    return this.evalService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSubjectEvaluationDto,
  ): Promise<SubjectEvaluation> {
    return this.evalService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.evalService.remove(id);
  }

  @Get('subject/:name')
  findBySubjectName(@Param('name') name: string): Promise<SubjectEvaluation[]> {
    return this.evalService.findBySubjectName(name);
  }
}