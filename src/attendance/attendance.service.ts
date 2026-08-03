// src/attendance/attendance.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

import { Attendance, AttendanceType } from './attendance.entity';
import { Student } from '../students/student.entity';
import { AttendanceRule } from './attendance_rules';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private repo: Repository<Attendance>,

    @InjectRepository(AttendanceRule)
    private ruleRepo: Repository<AttendanceRule>,

    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
  ) {}

  // =====================================================
  // QR SCAN (CHECK-IN)
  // =====================================================
  async scan(dto: {
    studentId: string;
    attendanceDate: string;
    deviceTime?: string;
  }) {
    // Validate UUID format before hitting the DB
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!dto.studentId || !uuidRe.test(dto.studentId)) {
      throw new BadRequestException('Invalid student QR code. Please scan a valid student card.');
    }
    if (!dto.attendanceDate || !/^\d{4}-\d{2}-\d{2}$/.test(dto.attendanceDate)) {
      throw new BadRequestException('Invalid attendance date format. Expected YYYY-MM-DD.');
    }

    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
      relations: [
        'enrollments',
        'enrollments.class',
        'enrollments.class.yearLevel',
        'enrollments.class.yearLevel.level',
      ],
    });

    if (!student) throw new NotFoundException('Student not found. This QR code may be outdated.');

    const levelId = student.enrollments?.[0]?.class?.yearLevel?.level?.id;

    if (!levelId) throw new BadRequestException('Student level not found');

    const day = new Date(dto.attendanceDate)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    const rule = await this.ruleRepo.findOne({
      where: { levelId, dayOfWeek: day },
    });

    if (!rule) throw new BadRequestException('Rule not found');

    const now = dto.deviceTime ?? this.nowTime();

    let attendance = await this.repo.findOne({
      where: {
        student_id: dto.studentId,
        attendance_date: dto.attendanceDate,
      },
    });

    // Already checked in today — block duplicate scan
    if (attendance?.check_in) {
      throw new ConflictException({
        message: 'This student has already been checked in today.',
        check_in: attendance.check_in,
        type: attendance.type,
        remark: attendance.remark,
      });
    }

    if (!attendance) {
      attendance = this.repo.create({
        student_id: dto.studentId,
        attendance_date: dto.attendanceDate,
      });
    }

    attendance.check_in = now;

    const current = this.toMinutes(now);
    const start = this.toMinutes(rule.checkInStart);
    const late = this.toMinutes(rule.lateAfter);

    if (current < start) {
      attendance.type = AttendanceType.PRESENT;
      attendance.remark = 'EARLY';
    } else if (current <= late) {
      attendance.type = AttendanceType.PRESENT;
      attendance.remark = 'ON_TIME';
    } else {
      attendance.type = AttendanceType.LATE;
      attendance.remark = 'LATE';
    }

    return this.repo.save(attendance);
  }

  // =====================================================
  // CHECKOUT
  // =====================================================
  async checkout(dto: {
    studentId: string;
    attendanceDate: string;
    deviceTime?: string;
  }) {
    // ── 1. Load student + level (same as scan) ────────────────────────────
    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
      relations: [
        'enrollments',
        'enrollments.class',
        'enrollments.class.yearLevel',
        'enrollments.class.yearLevel.level',
      ],
    });

    if (!student) throw new NotFoundException('Student not found');

    const levelId = student.enrollments?.[0]?.class?.yearLevel?.level?.id;
    if (!levelId) throw new BadRequestException('Student level not found');

    // ── 2. Load rule for the day ──────────────────────────────────────────
    const day = new Date(dto.attendanceDate)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    const rule = await this.ruleRepo.findOne({
      where: { levelId, dayOfWeek: day },
    });

    if (!rule) throw new BadRequestException('Rule not found');

    // ── 3. Find existing check-in record ──────────────────────────────────
    const attendance = await this.repo.findOne({
      where: {
        student_id: dto.studentId,
        attendance_date: dto.attendanceDate,
      },
    });

    if (!attendance) throw new NotFoundException('Check-in record not found');

    // ── 4. Rule engine (mirrors scan logic) ───────────────────────────────
    const now = dto.deviceTime ?? this.nowTime();
    const current = this.toMinutes(now);
    const early = this.toMinutes(rule.earlyBefore); // e.g. 14:00
    const end = this.toMinutes(rule.checkOutEnd); // e.g. 15:30

    if (current < early) {
      attendance.check_out_remark = 'EARLY_CHECKOUT';
    } else if (current <= end) {
      attendance.check_out_remark = 'ON_TIME';
    } else {
      attendance.check_out_remark = 'LATE_CHECKOUT';
    }

    attendance.check_out = now;

    return this.repo.save(attendance);
  }

  // =====================================================
  // ADMIN OVERRIDE
  // =====================================================
  async adminUpdate(id: string, dto: Partial<Attendance>) {
    const attendance = await this.repo.findOne({ where: { id } });

    if (!attendance) throw new NotFoundException('Not found');

    Object.assign(attendance, dto);

    return this.repo.save(attendance);
  }

  // =====================================================
  // 🔵 AUTO ABSENT (CRON SUPPORT)
  // =====================================================
  async markAbsent(date: string) {
    const students = await this.studentRepo.find({
      relations: [
        'enrollments',
        'enrollments.class',
        'enrollments.class.yearLevel',
        'enrollments.class.yearLevel.level',
      ],
    });

    const existing = await this.repo.find({
      where: { attendance_date: date },
    });

    const existingMap = new Set(existing.map((a) => a.student_id));

    const absentList: Attendance[] = [];

    for (const student of students) {
      if (!existingMap.has(student.id)) {
        absentList.push(
          this.repo.create({
            student_id: student.id,
            attendance_date: date,
            type: AttendanceType.ABSENT,
            remark: 'AUTO ABSENT (NO SCAN)',
          }),
        );
      }
    }

    if (absentList.length) {
      await this.repo.save(absentList);
    }
  }

  // =====================================================
  // HELPERS
  // =====================================================
  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private nowTime(): string {
    return new Date().toTimeString().slice(0, 8);
  }

  // =====================================================
  // CRUD
  // =====================================================
  create(dto: Partial<Attendance>) {
    return this.repo.save(this.repo.create(dto));
  }

  async findAll(filters?: { startDate?: string; endDate?: string; classId?: string }) {
    const today = new Date().toISOString().split('T')[0];

    // Determine the single date being queried (if any)
    const singleDate =
      filters?.startDate && filters?.endDate && filters.startDate === filters.endDate
        ? filters.startDate
        : !filters?.startDate && !filters?.endDate
          ? today
          : null;

    // Auto-mark absent for the queried date (today or any specific past date)
    if (singleDate) {
      await this.markAbsent(singleDate);
    }

    const where: any = {};

    if (singleDate) {
      where.attendance_date = singleDate;
    } else if (filters?.startDate && filters?.endDate) {
      where.attendance_date = Between(filters.startDate, filters.endDate);
    } else if (filters?.startDate) {
      where.attendance_date = MoreThanOrEqual(filters.startDate);
    } else if (filters?.endDate) {
      where.attendance_date = LessThanOrEqual(filters.endDate);
    }

    return this.repo.find({
      where,
      relations: [
        'student',
        'student.enrollments',
        'student.enrollments.class',
        'student.enrollments.class.yearLevel',
        'student.enrollments.class.yearLevel.level',
      ],
      order: { attendance_date: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(id: string) {
    const attendance = await this.repo.findOne({ where: { id } });

    if (!attendance) throw new NotFoundException('Attendance not found');

    return attendance;
  }

  async update(id: string, dto: Partial<Attendance>) {
    const attendance = await this.findOne(id);
    Object.assign(attendance, dto);
    return this.repo.save(attendance);
  }

  async remove(id: string) {
    const attendance = await this.findOne(id);
    return this.repo.remove(attendance);
  }
}
