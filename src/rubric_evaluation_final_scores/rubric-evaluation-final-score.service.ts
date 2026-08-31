import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RubricEvaluationFinalScore } from './rubric-evaluation-final-score.entity';

export interface SaveRubricEvaluationFinalScoreDto {
  classId?: string | null;
  className?: string | null;
  studentId: string;
  studentName?: string | null;
  subjectId?: string | null;
  subjectKey?: string | null;
  subjectName?: string | null;
  reportForm: string;
  reportTemplate?: string | null;
  gradeLevel?: number | string | null;
  reportMonth: number | string;
  reportYear?: string | number | null;
  lessonFrom?: number | string | null;
  lessonTo?: number | string | null;
  totalScore?: number | string | null;
  averageScore?: number | string | null;
  finalScore?: number | string | null;
  totalCell?: string | null;
  averageCell?: string | null;
  finalCell?: string | null;
  scoreCells?: Record<string, unknown> | null;
  source?: string | null;
}

@Injectable()
export class RubricEvaluationFinalScoreService {
  constructor(
    @InjectRepository(RubricEvaluationFinalScore)
    private readonly repo: Repository<RubricEvaluationFinalScore>,
  ) {}

  private text(value: unknown) {
    return String(value || '').trim();
  }

  private integer(value: unknown, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
  }

  private optionalNumber(value: unknown) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  findAll(query: Partial<SaveRubricEvaluationFinalScoreDto> = {}) {
    const where: Record<string, unknown> = {};
    const filters: Array<[keyof SaveRubricEvaluationFinalScoreDto, string]> = [
      ['classId', 'classId'],
      ['studentId', 'studentId'],
      ['subjectKey', 'subjectKey'],
      ['reportForm', 'reportForm'],
      ['reportYear', 'reportYear'],
    ];

    filters.forEach(([sourceKey, targetKey]) => {
      const value = this.text(query[sourceKey]);
      if (value) where[targetKey] = value;
    });

    const reportMonth = this.optionalNumber(query.reportMonth);
    if (reportMonth !== null) where.reportMonth = Math.floor(reportMonth);

    return this.repo.find({
      where,
      order: { updatedAt: 'DESC' },
    });
  }

  async save(dto: SaveRubricEvaluationFinalScoreDto) {
    const classId = this.text(dto.classId);
    const className = this.text(dto.className);
    const studentId = this.text(dto.studentId);
    const studentName = this.text(dto.studentName);
    const subjectId = this.text(dto.subjectId);
    const subjectKey = this.text(dto.subjectKey || dto.subjectId || dto.subjectName);
    const subjectName = this.text(dto.subjectName);
    const reportForm = this.text(dto.reportForm);
    const reportTemplate = this.text(dto.reportTemplate);
    const gradeLevel = this.optionalNumber(dto.gradeLevel);
    const reportMonth = this.integer(dto.reportMonth, 0);
    const reportYear = this.text(dto.reportYear);
    const lessonFrom = this.integer(dto.lessonFrom, 0);
    const lessonTo = this.integer(dto.lessonTo, lessonFrom);
    const totalScore = this.optionalNumber(dto.totalScore);
    const averageScore = this.optionalNumber(dto.averageScore);
    const finalScore = this.optionalNumber(dto.finalScore);

    if (!studentId || !subjectKey || !reportForm) {
      throw new BadRequestException('studentId, subjectKey, and reportForm are required.');
    }
    if (reportMonth < 1) {
      throw new BadRequestException('reportMonth is required.');
    }
    if (lessonFrom < 0 || lessonTo < lessonFrom) {
      throw new BadRequestException('Invalid lesson range.');
    }

    let record = await this.repo.findOne({
      where: {
        classId,
        studentId,
        subjectKey,
        reportForm,
        reportMonth,
        reportYear,
      },
      order: { updatedAt: 'DESC' },
    });

    if (!record) {
      record = this.repo.create({
        classId,
        studentId,
        subjectKey,
        reportForm,
        reportMonth,
        reportYear,
      });
    }

    record.lessonFrom = lessonFrom;
    record.lessonTo = lessonTo;
    record.className = className;
    record.studentName = studentName;
    record.subjectId = subjectId;
    record.subjectName = subjectName;
    record.reportTemplate = reportTemplate;
    record.gradeLevel = gradeLevel === null ? null : Math.floor(gradeLevel);
    record.totalScore = totalScore;
    record.averageScore = averageScore;
    record.finalScore = finalScore;
    record.totalCell = this.text(dto.totalCell);
    record.averageCell = this.text(dto.averageCell);
    record.finalCell = this.text(dto.finalCell);
    record.scoreCells = dto.scoreCells || null;
    record.source = this.text(dto.source);

    return this.repo.save(record);
  }
}
