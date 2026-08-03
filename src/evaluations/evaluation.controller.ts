import { Controller, Post, Body, Get, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { Evaluation } from './evaluation.entity';

@Controller('evaluations')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  create(@Body() dto: CreateEvaluationDto): Promise<Evaluation> {
    return this.evaluationService.create(dto);
  }

  @Get()
  findAll(): Promise<Evaluation[]> {
    return this.evaluationService.findAll();
  }

  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string): Promise<Evaluation[]> {
    return this.evaluationService.findByStudent(studentId);
  }

  @Patch(':id')
  updateScore(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEvaluationDto,
  ): Promise<Evaluation> {
    return this.evaluationService.updateScore(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.evaluationService.remove(id);
  }
}
