import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Subject } from './subject.entity';
import { Lesson } from '../lesson/lesson.entity';
import { Class } from '../classes/class.entity';
import { SubjectType } from '../subject_types/subject-type.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,

    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,

    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,

    @InjectRepository(SubjectType)
    private readonly subjectTypeRepo: Repository<SubjectType>,
  ) {}

  private readonly RELATIONS = [
    'class',
    'subjectType',
    'lessons',
    'lessons.subjectType',
    'lessons.yearLevel',
    'lessons.curriculums',
  ];

  private getLessonTimestamp(lesson: Lesson | null | undefined): number {
    const parsed = new Date(
      lesson?.updatedAt || lesson?.createdAt || 0,
    ).getTime();

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private getSubjectTimestamp(subject: Subject | null | undefined): number {
    const parsed = new Date(
      subject?.update_dt || subject?.create_dt || 0,
    ).getTime();

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private getOrderedLessons(subject: Subject | null | undefined): Lesson[] {
    const lessons = Array.isArray(subject?.lessons) ? [...subject.lessons] : [];

    lessons.sort(
      (left, right) =>
        this.getLessonTimestamp(right) - this.getLessonTimestamp(left),
    );

    return lessons;
  }

  private getSubjectYearLevelId(subject: Subject | null | undefined): string {
    return String(subject?.class?.year_level_id || '').trim();
  }

  private hydrateSubjectsWithFallbackLessons(
    subjects: Subject[],
    lessons: Lesson[],
  ): Subject[] {
    const assignedLessonIds = new Set<string>();
    const subjectQueuesByYearLevel = new Map<string, Subject[]>();
    const lessonQueuesByYearLevel = new Map<string, Lesson[]>();

    const hydratedSubjects = subjects.map((subject) => ({
      ...subject,
      lessons: Array.isArray(subject?.lessons) ? [...subject.lessons] : [],
    }));

    hydratedSubjects.forEach((subject) => {
      this.getOrderedLessons(subject).forEach((lesson) => {
        const lessonId = String(lesson?.id || '').trim();

        if (lessonId) {
          assignedLessonIds.add(lessonId);
        }
      });

      if (this.getOrderedLessons(subject).length > 0) {
        return;
      }

      const yearLevelId = this.getSubjectYearLevelId(subject);

      if (!yearLevelId) {
        return;
      }

      if (!subjectQueuesByYearLevel.has(yearLevelId)) {
        subjectQueuesByYearLevel.set(yearLevelId, []);
      }

      subjectQueuesByYearLevel.get(yearLevelId)!.push(subject);
    });

    lessons.forEach((lesson) => {
      const lessonId = String(lesson?.id || '').trim();
      const yearLevelId = String(lesson?.yearLevelId || lesson?.yearLevel?.id || '')
        .trim();
      const subjectTypeName = String(lesson?.subjectType?.name || '').trim();

      if (
        !lessonId ||
        !yearLevelId ||
        !subjectTypeName ||
        lesson?.subjectType?.is_deleted === true ||
        assignedLessonIds.has(lessonId)
      ) {
        return;
      }

      if (!lessonQueuesByYearLevel.has(yearLevelId)) {
        lessonQueuesByYearLevel.set(yearLevelId, []);
      }

      lessonQueuesByYearLevel.get(yearLevelId)!.push(lesson);
    });

    subjectQueuesByYearLevel.forEach((subjectQueue, yearLevelId) => {
      const lessonQueue = lessonQueuesByYearLevel.get(yearLevelId) || [];

      if (!lessonQueue.length) {
        return;
      }

      const orderedSubjects = [...subjectQueue].sort(
        (left, right) =>
          this.getSubjectTimestamp(right) - this.getSubjectTimestamp(left),
      );
      const orderedLessons = [...lessonQueue].sort(
        (left, right) =>
          this.getLessonTimestamp(right) - this.getLessonTimestamp(left),
      );

      orderedSubjects.forEach((subject, index) => {
        const matchedLesson = orderedLessons[index];

        if (matchedLesson) {
          subject.lessons = [matchedLesson];
        }
      });
    });

    return hydratedSubjects;
  }

  private hasVisibleSubjectType(subject: Subject | null | undefined): boolean {
    const directSubjectTypeName = String(subject?.subjectType?.name || '').trim();

    if (
      directSubjectTypeName &&
      directSubjectTypeName !== 'Untitled Subject' &&
      subject?.subjectType?.is_deleted !== true
    ) {
      return true;
    }

    return this.getOrderedLessons(subject).some((lesson) => {
      const subjectType = lesson?.subjectType as
        | { name?: string; is_deleted?: boolean }
        | undefined;
      const name = String(subjectType?.name || '').trim();

      return (
        !!name &&
        name !== 'Untitled Subject' &&
        subjectType?.is_deleted !== true
      );
    });
  }

  private async getSubject(id: string): Promise<Subject> {
    const subject = await this.subjectRepo.findOne({
      where: { id },
      relations: this.RELATIONS,
    });
    if (!subject) throw new NotFoundException(`Subject ${id} not found`);
    return subject;
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async create(dto: CreateSubjectDto): Promise<Subject> {
    const subject = this.subjectRepo.create();

    if (dto.class_id) {
      const cls = await this.classRepo.findOne({ where: { id: dto.class_id } });
      if (!cls)
        throw new BadRequestException(`Class ${dto.class_id} not found`);
      subject.class_id = cls.id;
      subject.class = cls;
    }

    const subjectTypeId = dto.subjectTypeId || dto.subject_type_id;
    if (subjectTypeId) {
      const subjectType = await this.subjectTypeRepo.findOne({
        where: { id: subjectTypeId },
      });
      if (!subjectType)
        throw new BadRequestException(`Subject type ${subjectTypeId} not found`);
      subject.subjectTypeId = subjectType.id;
      subject.subjectType = subjectType;
    }

    // ✅ Link one or many existing lessons
    if (dto.lesson_ids?.length) {
      const lessons = await this.lessonRepo.findBy({
        id: In(dto.lesson_ids),
      });
      if (lessons.length !== dto.lesson_ids.length)
        throw new BadRequestException('One or more lesson IDs not found');
      subject.lessons = lessons;
    }

    if (dto.is_active !== undefined) subject.is_active = dto.is_active;

    const saved = await this.subjectRepo.save(subject);
    return this.getSubject(saved.id);
  }

  // ─── READ ──────────────────────────────────────────────────────────────────

  async findAll(): Promise<Subject[]> {
    const subjects = await this.subjectRepo.find({
      where: { is_deleted: false },
      relations: this.RELATIONS,
      order: { create_dt: 'DESC' },
    });
    const lessons = await this.lessonRepo.find({
      relations: ['subjectType', 'yearLevel', 'curriculums'],
      order: { createdAt: 'DESC' },
    });
    const hydratedSubjects = this.hydrateSubjectsWithFallbackLessons(
      subjects,
      lessons,
    );

    return hydratedSubjects.filter((subject) =>
      this.hasVisibleSubjectType(subject),
    );
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.getSubject(id);

    // Legacy subjects may have subject_type_id = NULL and no linked lessons.
    // findAll runs the same fallback hydration to recover a display name from
    // an unmapped lesson in the same grade; do it here too so the assignment
    // list page can render a proper subject label instead of a bare UUID.
    if (this.hasVisibleSubjectType(subject)) {
      return subject;
    }

    const lessons = await this.lessonRepo.find({
      relations: ['subjectType', 'yearLevel', 'curriculums'],
      order: { createdAt: 'DESC' },
    });
    const [hydrated] = this.hydrateSubjectsWithFallbackLessons(
      [subject],
      lessons,
    );

    return hydrated || subject;
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateSubjectDto): Promise<Subject> {
    const subject = await this.getSubject(id);

    if (dto.class_id) {
      const cls = await this.classRepo.findOne({ where: { id: dto.class_id } });
      if (!cls)
        throw new BadRequestException(`Class ${dto.class_id} not found`);
      subject.class_id = cls.id;
      subject.class = cls;
    }

    const subjectTypeId = dto.subjectTypeId || dto.subject_type_id;
    if (subjectTypeId) {
      const subjectType = await this.subjectTypeRepo.findOne({
        where: { id: subjectTypeId },
      });
      if (!subjectType)
        throw new BadRequestException(`Subject type ${subjectTypeId} not found`);
      subject.subjectTypeId = subjectType.id;
      subject.subjectType = subjectType;
    }

    // ✅ Replace lesson links
    if (dto.lesson_ids?.length) {
      const lessons = await this.lessonRepo.findBy({
        id: In(dto.lesson_ids),
      });
      if (lessons.length !== dto.lesson_ids.length)
        throw new BadRequestException('One or more lesson IDs not found');
      subject.lessons = lessons;
    }

    if (dto.is_active !== undefined) subject.is_active = dto.is_active;

    await this.subjectRepo.save(subject);
    return this.getSubject(id);
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────

  async remove(id: string): Promise<{ message: string }> {
    const subject = await this.getSubject(id);
    subject.is_deleted = true;
    await this.subjectRepo.save(subject);
    return { message: `Subject ${id} deleted successfully` };
  }
}
