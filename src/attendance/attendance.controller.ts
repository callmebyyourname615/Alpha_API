// src/attendance/attendance.controller.ts

import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';

@ApiTags('Attendances')
@ApiBearerAuth()

@Controller('attendances')
export class AttendanceController {
  constructor(private service: AttendanceService) {}

  @Post('scan')
  @ApiOperation({ summary: 'QR scan check-in' })
  scan(@Body() dto: any) {
    return this.service.scan(dto);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'QR scan check-out' })
  checkout(@Body() dto: any) {
    return this.service.checkout(dto);
  }

  @Post('auto-absent')
  @ApiOperation({ summary: 'Mark all students absent for a given date' })
  autoAbsent(@Body() dto: { date: string }) {
    return this.service.markAbsent(dto.date);
  }

  @Post()
  @ApiOperation({ summary: 'Create attendance record manually' })
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all attendance records' })
  @ApiQuery({ name: 'start_date', required: false, example: '2026-05-16' })
  @ApiQuery({ name: 'end_date', required: false, example: '2026-05-16' })
  @ApiQuery({ name: 'class_id', required: false })
  findAll(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('class_id') classId?: string,
  ) {
    return this.service.findAll({ startDate, endDate, classId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attendance record by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update attendance record (PUT)' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update attendance record (PATCH)' })
  patch(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete attendance record' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}