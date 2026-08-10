import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RubricReportMonthSetting } from './rubric-report-month-setting.entity';

export interface SaveRubricReportMonthSettingDto {
  classId: string;
  studentId?: string | null;
  subjectId: string;
  month: number;
  lessonFrom: number;
  lessonTo: number;
}

@Injectable()
export class RubricReportMonthSettingService {
  constructor(
    @InjectRepository(RubricReportMonthSetting)
    private readonly repo: Repository<RubricReportMonthSetting>,
  ) {}

  private text(value: unknown) {
    return String(value || '').trim();
  }

  private number(value: unknown, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
  }

  findAll() {
    return this.repo.find({ order: { updatedAt: 'DESC' } });
  }

  async save(dto: SaveRubricReportMonthSettingDto) {
    const classId = this.text(dto.classId);
    const studentId = this.text(dto.studentId);
    const subjectId = this.text(dto.subjectId);
    const month = this.number(dto.month, 1);
    const lessonFrom = this.number(dto.lessonFrom, 1);
    const lessonTo = this.number(dto.lessonTo, lessonFrom);

    if (!classId || !subjectId) {
      throw new BadRequestException('classId and subjectId are required.');
    }
    if (month < 1 || lessonFrom < 1 || lessonTo < lessonFrom) {
      throw new BadRequestException('Invalid month or lesson range.');
    }

    let setting = await this.repo.findOne({ where: { classId, studentId, subjectId, month } });
    if (!setting) {
      setting = this.repo.create({ classId, studentId, subjectId, month });
    }
    setting.month = month;
    setting.lessonFrom = lessonFrom;
    setting.lessonTo = lessonTo;
    return this.repo.save(setting);
  }
}
