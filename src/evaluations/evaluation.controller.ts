<<<<<<< HEAD
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
=======
import { Controller, Post, Body, Get, Param, Patch, Delete, ParseIntPipe, Query } from '@nestjs/common';
>>>>>>> e882894 (a)
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

  @Get('report-source')
  findReportSource(
    @Query('classId') classId: string,
    @Query('subjectEvaluationIds') subjectEvaluationIds = '',
  ) {
    return this.evaluationService.findReportSource(
      classId,
      subjectEvaluationIds.split(',').map((id) => id.trim()).filter(Boolean),
    );
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
