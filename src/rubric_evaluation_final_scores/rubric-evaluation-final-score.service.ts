import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
  reportMaximum?: number | string | null;
  totalCell?: string | null;
  averageCell?: string | null;
  finalCell?: string | null;
  scoreCells?: Record<string, unknown> | null;
  source?: string | null;
}

export interface FindRubricEvaluationFinalScoreDto extends Partial<SaveRubricEvaluationFinalScoreDto> {
  reportMonths?: string | number[];
  reportYears?: string | Array<string | number>;
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

  private list(value: unknown) {
    if (Array.isArray(value)) return value.map((item) => this.text(item)).filter(Boolean);
    return this.text(value).split(',').map((item) => item.trim()).filter(Boolean);
  }

  findAll(query: FindRubricEvaluationFinalScoreDto = {}) {
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

    const reportMonths = this.list(query.reportMonths)
      .map((value) => this.optionalNumber(value))
      .filter((value): value is number => value !== null)
      .map(Math.floor);
    if (reportMonths.length) where.reportMonth = In([...new Set(reportMonths)]);
    else {
      const reportMonth = this.optionalNumber(query.reportMonth);
      if (reportMonth !== null) where.reportMonth = Math.floor(reportMonth);
    }

    const reportYears = this.list(query.reportYears);
    if (reportYears.length) where.reportYear = In([...new Set(reportYears)]);

    return this.repo.find({
      where,
      order: { updatedAt: 'DESC' },
    });
  }

  private normalize(dto: SaveRubricEvaluationFinalScoreDto) {
    const classId = this.text(dto.classId);
    const className = this.text(dto.className);
    const studentId = this.text(dto.studentId);
    const studentName = this.text(dto.studentName);
    const subjectId = this.text(dto.subjectId);
    const subjectKey = this.text(
      dto.subjectKey || dto.subjectId || dto.subjectName,
    );
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
    const parsedFinalScore = this.optionalNumber(dto.finalScore);
    const reportMaximum = this.optionalNumber(dto.reportMaximum);
    if (reportMaximum !== null && reportMaximum <= 0) {
      throw new BadRequestException('reportMaximum must be greater than zero.');
    }
    const roundedFinalScore = parsedFinalScore === null ? null : Math.max(0, Math.round(parsedFinalScore));
    const finalScore = roundedFinalScore === null || reportMaximum === null
      ? roundedFinalScore
      : Math.min(reportMaximum, roundedFinalScore);
    const finalCell = this.text(dto.finalCell);
    const scoreCells = dto.scoreCells && typeof dto.scoreCells === 'object'
      ? { ...dto.scoreCells }
      : null;
    // Keep the persisted report cell and the scalar final score consistent.
    // Monthly reports intentionally treat the rendered final cell as the
    // authoritative teacher-facing score.
    if (scoreCells && finalCell && finalScore !== null) scoreCells[finalCell] = String(finalScore);

    if (!studentId || !subjectKey || !reportForm) {
      throw new BadRequestException(
        'studentId, subjectKey, and reportForm are required.',
      );
    }
    if (reportMonth < 1) {
      throw new BadRequestException('reportMonth is required.');
    }
    if (lessonFrom < 0 || lessonTo < lessonFrom) {
      throw new BadRequestException('Invalid lesson range.');
    }

    return {
      classId,
      className,
      studentId,
      studentName,
      subjectId,
      subjectKey,
      subjectName,
      reportForm,
      reportTemplate,
      gradeLevel: gradeLevel === null ? null : Math.floor(gradeLevel),
      reportMonth,
      reportYear,
      lessonFrom,
      lessonTo,
      totalScore,
      averageScore,
      finalScore,
      totalCell: this.text(dto.totalCell),
      averageCell: this.text(dto.averageCell),
      finalCell,
      scoreCells,
      source: this.text(dto.source),
    };
  }

  async save(dto: SaveRubricEvaluationFinalScoreDto) {
    const value = this.normalize(dto);
    let record = await this.repo.findOne({
      where: {
        classId: value.classId,
        studentId: value.studentId,
        subjectKey: value.subjectKey,
        reportForm: value.reportForm,
        reportMonth: value.reportMonth,
        reportYear: value.reportYear,
        lessonFrom: value.lessonFrom,
        lessonTo: value.lessonTo,
      },
      order: { updatedAt: 'DESC' },
    });

    record = record ? this.repo.merge(record, value) : this.repo.create(value);
    return this.repo.save(record);
  }

  async saveMany(dtos: SaveRubricEvaluationFinalScoreDto[]) {
    if (!dtos.length) throw new BadRequestException('At least one score is required.');
    if (dtos.length > 500) throw new BadRequestException('A maximum of 500 scores can be saved at once.');
    const values = dtos.map((dto) => this.normalize(dto));
    const records = this.repo.create(values);
    // TypeORM's JSONB DeepPartial type rejects Record<string, unknown> even
    // though the PostgreSQL driver accepts it correctly at runtime.
    await this.repo.upsert(records as any, {
      conflictPaths: ['classId', 'studentId', 'subjectKey', 'reportForm', 'reportMonth', 'reportYear', 'lessonFrom', 'lessonTo'],
      skipUpdateIfNoValuesChanged: true,
    });
    return { saved: values.length };
  }
}
