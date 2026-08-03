import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teaching } from './teaching.entity';
import { Subject } from '../subjects/subject.entity';
import { Lesson } from '../lesson/lesson.entity';
import { CreateTeachingDto } from './dto/create-teaching.dto';
import { UpdateTeachingDto } from './dto/update-teaching.dto';
import { GetTeachingByAdminDto } from './dto/get-teaching-by-admin.dto';

@Injectable()
export class TeachingService {
  constructor(
    @InjectRepository(Teaching)
    private readonly teachingRepo: Repository<Teaching>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
  ) {}

  private readonly teachingRelations = [
    'teacher',
    'subject',
    'subject.class',
    'subject.subjectType',
    'subject.lessons',
    'subject.lessons.subjectType',
    'subject.lessons.yearLevel',
    'academicYear',
    'branch',
  ] as const;

  private getLessonYearLevelId(lesson: Lesson | null | undefined): string {
    return String(lesson?.yearLevelId || lesson?.yearLevel?.id || '').trim();
  }

  private getSubjectYearLevelId(subject: Subject | null | undefined): string {
    return String(subject?.class?.year_level_id || '').trim();
  }

  private getOrderedLessons(subject: Subject | null | undefined): Lesson[] {
    const subjectLessons = Array.isArray(subject?.lessons)
      ? [...subject.lessons]
      : [];

    subjectLessons.sort(
      (left, right) =>
        this.getLessonTimestamp(right) - this.getLessonTimestamp(left),
    );

    return subjectLessons;
  }

  private resolveSubjectLesson(
    subject: Subject | null | undefined,
  ): Lesson | null {
    const orderedLessons = this.getOrderedLessons(subject);
    const subjectYearLevelId = this.getSubjectYearLevelId(subject);

    if (!orderedLessons.length) {
      return null;
    }

    return (
      orderedLessons.find(
        (lesson) => this.getLessonYearLevelId(lesson) === subjectYearLevelId,
      ) ||
      orderedLessons[0] ||
      null
    );
  }

  private resolveFallbackLesson(
    subject: Subject,
    availableLessons: Lesson[],
  ): Lesson | null {
    // Legacy subjects may have been created before subject-to-lesson links
    // existed. Only infer a document when the grade has exactly one candidate;
    // choosing one of several subjects/books would expose the wrong material.
    if (this.getOrderedLessons(subject).length || subject.subjectType) {
      return null;
    }

    const subjectYearLevelId = this.getSubjectYearLevelId(subject);
    if (!subjectYearLevelId) {
      return null;
    }

    const candidates = availableLessons.filter(
      (lesson) => this.getLessonYearLevelId(lesson) === subjectYearLevelId,
    );

    return candidates.length === 1 ? candidates[0] : null;
  }

  private hydrateTeaching(
    teaching: Teaching,
    availableLessons: Lesson[] = [],
  ): Teaching {
    if (!teaching?.subject) {
      return teaching;
    }

    const fallbackLesson = this.resolveFallbackLesson(
      teaching.subject,
      availableLessons,
    );
    if (fallbackLesson) {
      teaching.subject.lessons = [fallbackLesson];
    }

    const resolvedLesson = this.resolveSubjectLesson(teaching.subject);
    // A subject can be assigned directly to a subject type without a linked
    // lesson document.  Do not overwrite that valid type with null just
    // because no lesson was found in this response.
    const resolvedSubjectType =
      resolvedLesson?.subjectType || teaching.subject.subjectType || null;

    Object.assign(teaching.subject, {
      subjectType: resolvedSubjectType,
    });

    return teaching;
  }

  private hydrateTeachings(
    teachings: Teaching[],
    availableLessons: Lesson[] = [],
  ): Teaching[] {
    // A teaching assignment is still valid when its linked lesson documents
    // have not been configured yet.  Filtering those records here made the
    // list endpoint return an empty array after a successful assignment save.
    return teachings.map((teaching) =>
      this.hydrateTeaching(teaching, availableLessons),
    );
  }

  private async getAvailableLessons(): Promise<Lesson[]> {
    return this.lessonRepo.find({
      relations: ['subjectType', 'yearLevel'],
      order: { updatedAt: 'DESC' },
    });
  }

  private async findDuplicateAssignment(
    payload: Pick<Teaching, 'adminId' | 'subjectId' | 'academicYearId'>,
    excludeId?: string,
  ): Promise<Teaching | null> {
    const query = this.teachingRepo
      .createQueryBuilder('teaching')
      .where('teaching.adminId = :adminId', { adminId: payload.adminId })
      .andWhere('teaching.subjectId = :subjectId', {
        subjectId: payload.subjectId,
      })
      .andWhere('teaching.academicYearId = :academicYearId', {
        academicYearId: payload.academicYearId,
      });

    if (excludeId) {
      query.andWhere('teaching.id != :excludeId', { excludeId });
    }

    return query.getOne();
  }

  private getLessonTimestamp(lesson: any): number {
    const parsed = new Date(
      lesson?.updatedAt ||
        lesson?.createdAt ||
        lesson?.update_dt ||
        lesson?.create_dt ||
        0,
    ).getTime();

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private getMissingLessonDocuments(lesson: any): string[] {
    const missing: string[] = [];

    if (!String(lesson?.s_file || '').trim()) {
      missing.push('Student Guide');
    }

    if (!String(lesson?.t_file || '').trim()) {
      missing.push('Teacher Guide');
    }

    return missing;
  }

  private async validateSubjectLessonDocuments(
    subjectId: string,
  ): Promise<void> {
    const subject = await this.subjectRepo.findOne({
      where: { id: subjectId },
      relations: [
        'class',
        'lessons',
        'lessons.subjectType',
        'lessons.yearLevel',
      ],
    });

    if (!subject) {
      throw new BadRequestException(`Subject ${subjectId} not found`);
    }

    const lessons = this.getOrderedLessons(subject);

    if (!lessons.length) {
      throw new BadRequestException(
        'The selected subject does not have lesson documents mapped yet.',
      );
    }

    const matchedLesson = this.resolveSubjectLesson(subject);

    if (!matchedLesson) {
      throw new BadRequestException(
        'The selected subject does not have lesson documents mapped yet.',
      );
    }

    const missingDocuments = this.getMissingLessonDocuments(matchedLesson);

    if (missingDocuments.length) {
      throw new BadRequestException(
        `The selected subject is missing ${missingDocuments.join(', ')} in lesson documents.`,
      );
    }
  }

  // Create - Assign teacher to subject
  async create(createDto: CreateTeachingDto): Promise<Teaching> {
    await this.validateSubjectLessonDocuments(createDto.subjectId);

    const existing = await this.findDuplicateAssignment({
      adminId: createDto.adminId,
      subjectId: createDto.subjectId,
      academicYearId: createDto.academicYearId,
    });

    if (existing) {
      throw new BadRequestException(
        'This teacher is already assigned to this subject in the same academic year.',
      );
    }

    const teaching = this.teachingRepo.create(createDto);
    const savedTeaching = await this.teachingRepo.save(teaching);
    return this.findOne(savedTeaching.id);
  }

  // Get all teachings with optional filters
  async findAll(branchId?: string, academicYearId?: string) {
    const query = this.teachingRepo
      .createQueryBuilder('teaching')
      .leftJoinAndSelect('teaching.teacher', 'teacher')
      .leftJoinAndSelect('teaching.subject', 'subject')
      .leftJoinAndSelect('teaching.academicYear', 'academicYear')
      .leftJoinAndSelect('teaching.branch', 'branch')
      .leftJoinAndSelect('subject.class', 'class')
      .leftJoinAndSelect('subject.subjectType', 'subjectType')
      .leftJoinAndSelect('subject.lessons', 'lessons')
      .leftJoinAndSelect('lessons.subjectType', 'lessonSubjectType')
      .leftJoinAndSelect('lessons.yearLevel', 'lessonYearLevel');

    if (branchId) {
      query.andWhere('teaching.branchId = :branchId', { branchId });
    }
    if (academicYearId) {
      query.andWhere('teaching.academicYearId = :academicYearId', {
        academicYearId,
      });
    }

    const teachings = await query
      .orderBy('teaching.createdAt', 'DESC')
      .getMany();
    return this.hydrateTeachings(teachings, await this.getAvailableLessons());
  }

  async findByAdmin(dto: GetTeachingByAdminDto) {
    const { adminId, branchId, academicYearId } = dto;

    const query = this.teachingRepo
      .createQueryBuilder('teaching')
      .leftJoinAndSelect('teaching.teacher', 'teacher')
      .leftJoinAndSelect('teaching.subject', 'subject')
      .leftJoinAndSelect('teaching.academicYear', 'academicYear')
      .leftJoinAndSelect('teaching.branch', 'branch')
      .leftJoinAndSelect('subject.class', 'class')
      .leftJoinAndSelect('subject.subjectType', 'subjectType')
      .leftJoinAndSelect('subject.lessons', 'lessons')
      .leftJoinAndSelect('lessons.subjectType', 'lessonSubjectType')
      .leftJoinAndSelect('lessons.yearLevel', 'lessonYearLevel')
      .where('teaching.adminId = :adminId', { adminId });

    if (branchId) {
      query.andWhere('teaching.branchId = :branchId', { branchId });
    }

    if (academicYearId) {
      query.andWhere('teaching.academicYearId = :academicYearId', {
        academicYearId,
      });
    }

    const teachings = this.hydrateTeachings(
      await query.orderBy('teaching.createdAt', 'DESC').getMany(),
      await this.getAvailableLessons(),
    );

    return {
      adminId,
      totalSubjects: teachings.length,
      data: teachings,
    };
  }

  async findOne(id: string): Promise<Teaching> {
    const teaching = await this.teachingRepo.findOne({
      where: { id },
      relations: [...this.teachingRelations],
    });

    if (!teaching) {
      throw new NotFoundException(
        `Teaching assignment with ID ${id} not found`,
      );
    }

    return this.hydrateTeaching(teaching, await this.getAvailableLessons());
  }

  // Update
  async update(id: string, updateDto: UpdateTeachingDto): Promise<Teaching> {
    const existingTeaching = await this.findOne(id);
    const nextValues = {
      adminId: updateDto.adminId ?? existingTeaching.adminId,
      subjectId: updateDto.subjectId ?? existingTeaching.subjectId,
      academicYearId:
        updateDto.academicYearId ?? existingTeaching.academicYearId,
      branchId: updateDto.branchId ?? existingTeaching.branchId,
    };

    await this.validateSubjectLessonDocuments(nextValues.subjectId);

    const duplicate = await this.findDuplicateAssignment(
      {
        adminId: nextValues.adminId,
        subjectId: nextValues.subjectId,
        academicYearId: nextValues.academicYearId,
      },
      id,
    );

    if (duplicate) {
      throw new BadRequestException(
        'This teacher is already assigned to this subject in the same academic year.',
      );
    }

    await this.teachingRepo.update(id, nextValues);

    return this.findOne(id); // re-fetch with full relations
  }

  // Hard delete for now — add is_deleted column to entity for soft delete later
  async remove(id: string): Promise<{ message: string }> {
    const teaching = await this.findOne(id);
    await this.teachingRepo.remove(teaching);
    return { message: 'Teaching assignment deleted successfully' };
  }
}
