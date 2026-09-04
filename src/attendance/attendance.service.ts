// src/attendance/attendance.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Attendance, AttendanceType } from './attendance.entity';
import { Student } from '../students/student.entity';
import { AttendanceRule } from './attendance_rules';
import { CacheService } from '../common/cache.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private repo: Repository<Attendance>,

    @InjectRepository(AttendanceRule)
    private ruleRepo: Repository<AttendanceRule>,

    @InjectRepository(Student)
    private studentRepo: Repository<Student>,

    private readonly cache: CacheService,
  ) {}

  private readonly attendanceListTtlSeconds = 45;
  private readonly attendanceDetailTtlSeconds = 120;

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

    const levelId = await this.getStudentLevelId(
      dto.studentId,
      'Student not found. This QR code may be outdated.',
    );

    if (!levelId) throw new BadRequestException('Student level not found');

    const day = new Date(dto.attendanceDate)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    const rule = await this.getAttendanceRule(levelId, day);

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

    const saved = await this.repo.save(attendance);
    await this.clearAttendanceCache(saved.id);
    return saved;
  }

  // =====================================================
  // CHECKOUT
  // =====================================================
  async checkout(dto: {
    studentId: string;
    attendanceDate: string;
    deviceTime?: string;
  }) {
    // ── 1. Load only the level needed by the rule engine ──────────────────
    const levelId = await this.getStudentLevelId(dto.studentId, 'Student not found');
    if (!levelId) throw new BadRequestException('Student level not found');

    // ── 2. Load rule for the day ──────────────────────────────────────────
    const day = new Date(dto.attendanceDate)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    const rule = await this.getAttendanceRule(levelId, day);

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

    const saved = await this.repo.save(attendance);
    await this.clearAttendanceCache(saved.id);
    return saved;
  }

  // =====================================================
  // ADMIN OVERRIDE
  // =====================================================
  async adminUpdate(id: string, dto: Partial<Attendance>) {
    const attendance = await this.repo.findOne({ where: { id } });

    if (!attendance) throw new NotFoundException('Not found');

    Object.assign(attendance, dto);

    const saved = await this.repo.save(attendance);
    await this.clearAttendanceCache(saved.id);
    return saved;
  }

  // =====================================================
  // 🔵 AUTO ABSENT (CRON SUPPORT)
  // =====================================================
  async markAbsent(date: string, clearCache = true) {
    await this.repo.query(
      `
        INSERT INTO "attendances" (
          "student_id",
          "attendance_date",
          "type",
          "scan_method",
          "remark",
          "created_at",
          "updated_at"
        )
        SELECT
          "students"."id",
          $1::date,
          $2,
          'QR',
          'AUTO ABSENT (NO SCAN)',
          NOW(),
          NOW()
        FROM "students"
        WHERE NOT EXISTS (
          SELECT 1
          FROM "attendances"
          WHERE "attendances"."student_id" = "students"."id"
            AND "attendances"."attendance_date" = $1::date
        )
        ON CONFLICT ("student_id", "attendance_date") DO NOTHING
      `,
      [date, AttendanceType.ABSENT],
    );
    if (clearCache) await this.clearAttendanceCache();
  }

  // =====================================================
  // HELPERS
  // =====================================================
  private async getStudentLevelId(
    studentId: string,
    notFoundMessage: string,
  ): Promise<string | null> {
    const row = await this.studentRepo
      .createQueryBuilder('student')
      .leftJoin('student.enrollments', 'enrollment')
      .leftJoin('enrollment.class', 'class')
      .leftJoin('class.yearLevel', 'yearLevel')
      .leftJoin('yearLevel.level', 'level')
      .select('student.id', 'student_id')
      .addSelect('level.id', 'level_id')
      .where('student.id = :studentId', { studentId })
      .getRawOne<{ student_id: string; level_id: string | null }>();

    if (!row) throw new NotFoundException(notFoundMessage);
    return row.level_id ?? null;
  }

  private async getAttendanceRule(levelId: string, dayOfWeek: string) {
    return this.cache.getOrSet(
      `attendance-rule:${levelId}:${dayOfWeek}`,
      600,
      () => this.ruleRepo.findOne({ where: { levelId, dayOfWeek } }),
    );
  }

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
  async create(dto: Partial<Attendance>) {
    const saved = await this.repo.save(this.repo.create(dto));
    await this.clearAttendanceCache(saved.id);
    return saved;
  }

  async findAll(filters?: {
    startDate?: string;
    endDate?: string;
    classId?: string;
  }) {
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
      await this.ensureAbsentMarked(singleDate);
    }

    return this.cache.getOrSet(
      `attendances:list:${this.stableCacheKey({
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        classId: filters?.classId,
      })}`,
      this.attendanceListTtlSeconds,
      async () => {
        const qb = this.repo
          .createQueryBuilder('attendance')
          .leftJoinAndSelect('attendance.student', 'student')
          .leftJoinAndSelect('student.enrollments', 'enrollment')
          .leftJoinAndSelect('enrollment.class', 'class')
          .leftJoinAndSelect('class.yearLevel', 'yearLevel')
          .leftJoinAndSelect('yearLevel.level', 'level');

        if (singleDate) {
          qb.where('attendance.attendance_date = :singleDate', { singleDate });
        } else if (filters?.startDate && filters?.endDate) {
          qb.where('attendance.attendance_date BETWEEN :startDate AND :endDate', {
            startDate: filters.startDate,
            endDate: filters.endDate,
          });
        } else if (filters?.startDate) {
          qb.where('attendance.attendance_date >= :startDate', {
            startDate: filters.startDate,
          });
        } else if (filters?.endDate) {
          qb.where('attendance.attendance_date <= :endDate', {
            endDate: filters.endDate,
          });
        }

        const normalizedClassId = filters?.classId?.trim();
        if (normalizedClassId) {
          qb.andWhere('enrollment.class_id = :classId', {
            classId: normalizedClassId,
          });
        }

        return qb
          .orderBy('attendance.attendance_date', 'DESC')
          .addOrderBy('attendance.created_at', 'DESC')
          .getMany();
      },
    );
  }

  async findOne(id: string) {
    return this.cache.getOrSet(
      `attendances:${id}`,
      this.attendanceDetailTtlSeconds,
      () => this.findOneUncached(id),
    );
  }

  private async findOneUncached(id: string) {
    const attendance = await this.repo.findOne({ where: { id } });

    if (!attendance) throw new NotFoundException('Attendance not found');

    return attendance;
  }

  async update(id: string, dto: Partial<Attendance>) {
    const attendance = await this.findOneUncached(id);
    Object.assign(attendance, dto);
    const saved = await this.repo.save(attendance);
    await this.clearAttendanceCache(saved.id);
    return saved;
  }

  async remove(id: string) {
    const attendance = await this.findOneUncached(id);
    const removed = await this.repo.remove(attendance);
    await this.clearAttendanceCache(id);
    return removed;
  }

  private async clearAttendanceCache(id?: string): Promise<void> {
    await Promise.all([
      this.cache.delPattern('attendances:list:*'),
      id ? this.cache.del(`attendances:${id}`) : Promise.resolve(),
    ]);
  }

  private async ensureAbsentMarked(date: string): Promise<void> {
    await this.cache.getOrSet(
      `attendances:auto-absent:${date}`,
      this.attendanceListTtlSeconds,
      async () => {
        await this.markAbsent(date, false);
        return true;
      },
    );
  }

  private stableCacheKey(value: Record<string, unknown>): string {
    const entries = Object.entries(value)
      .filter(([, item]) => item !== undefined && item !== null && item !== '')
      .sort(([left], [right]) => left.localeCompare(right));

    if (!entries.length) return 'default';

    return entries
      .map(([key, item]) => `${key}=${String(item).trim()}`)
      .join(':');
  }
}
