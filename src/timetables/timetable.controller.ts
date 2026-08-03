// src/timetables/timetable.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';

@Controller('timetables')
export class TimetableController {
  constructor(private readonly service: TimetableService) {}

  @Post()
  create(@Body() dto: CreateTimetableDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ✅ Get timetable for a class
  @Get('class/:classId')
  findByClass(@Param('classId') classId: string) {
    return this.service.findByClass(classId);
  }

  // ✅ Get timetable for a teacher
  @Get('teacher/:teacherId')
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.service.findByTeacher(teacherId);
  }

  // ✅ Get timetable for a branch
  @Get('branch/:branchId')
  findByBranch(@Param('branchId') branchId: string) {
    return this.service.findByBranch(branchId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTimetableDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}