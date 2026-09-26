import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  ATTENDANCE_TIME_ZONE,
  AttendanceService,
  attendanceLocalDateKey,
} from './attendance.service';

@Injectable()
export class AttendanceScheduler {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Every day at 00:01 — mark all students who have no record for today as ABSENT
  @Cron('1 0 * * *', { timeZone: ATTENDANCE_TIME_ZONE })
  async handleAutoAbsent() {
    const today = attendanceLocalDateKey();
    await this.attendanceService.markAbsent(today);
  }
}
