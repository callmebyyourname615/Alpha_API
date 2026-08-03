import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AttendanceService } from './attendance.service';

@Injectable()
export class AttendanceScheduler {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Every day at 00:01 — mark all students who have no record for today as ABSENT
  @Cron('1 0 * * *')
  async handleAutoAbsent() {
    const today = new Date().toISOString().split('T')[0];
    await this.attendanceService.markAbsent(today);
  }
}
