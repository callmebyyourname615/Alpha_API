// src/attendance/attendance.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceScheduler } from './attendance.scheduler';

import { Attendance } from './attendance.entity';
import { AttendanceRule } from './attendance_rules';
import { Student } from '../students/student.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Attendance,
      AttendanceRule,
      Student,
    ]),
  ],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceScheduler,
  ],
  exports: [AttendanceService],
})
export class AttendanceModule {}