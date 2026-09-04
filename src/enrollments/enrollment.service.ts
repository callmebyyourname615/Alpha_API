import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { Student } from '../students/student.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Class } from '../classes/class.entity';
import { Branch } from '../branches/branch.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { PromoteByClassDto, PromoteStudentsDto } from './dto/promote-students.dto';
import { CacheService } from '../common/cache.service';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(AcademicYear)
    private readonly academicYearRepo: Repository<AcademicYear>,

    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,

    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,

    private readonly cache: CacheService,
  ) {}

  private readonly enrollmentListTtlSeconds = 60;
  private readonly enrollmentDetailTtlSeconds = 120;
  private readonly enrollmentStudentTtlSeconds = 120;

  // =========================
  // CREATE
  // =========================
  async create(dto: CreateEnrollmentDto): Promise<Enrollment> {
    const student = await this.studentRepo.findOne({ where: { id: dto.studentId } });
    if (!student) throw new BadRequestException('studentId not found');

    const academicYear = await this.academicYearRepo.findOne({ where: { id: dto.academicYearId } });
    if (!academicYear) throw new BadRequestException('academicYearId not found');

    const cls = await this.classRepo.findOne({ where: { id: dto.classId } });
    if (!cls) throw new BadRequestException('classId not found');

    const branch = await this.branchRepo.findOne({ where: { id: dto.branchId } });
    if (!branch) throw new BadRequestException('branchId not found');

    const duplicate = await this.enrollmentRepo.findOne({
      where: { studentId: dto.studentId, academicYearId: dto.academicYearId },
    });
    if (duplicate) {
      throw new BadRequestException('Student is already enrolled in this academic year');
    }

    await this.enrollmentRepo.update(
      { studentId: dto.studentId, is_active: true },
      { is_active: false },
    );

    const enrollment = this.enrollmentRepo.create({
      studentId:      dto.studentId,      student,
      academicYearId: dto.academicYearId, academicYear,
      classId:        dto.classId,        class: cls,
      branchId:       dto.branchId,       branch,
      is_active:      dto.is_active ?? true,
    });

    const saved = await this.enrollmentRepo.save(enrollment);
    await this.clearEnrollmentAffectedCaches(dto.studentId);
    return this.findOne(saved.id);
  }

  // =========================
  // FIND ALL
  // =========================
  async findAll(
    branchId?: string,
    academicYearId?: string,
    classId?: string,
    isActive?: boolean,
  ): Promise<Enrollment[]> {
    return this.cache.getOrSet(
      `enrollments:list:${this.stableCacheKey({
        branchId,
        academicYearId,
        classId,
        isActive,
      })}`,
      this.enrollmentListTtlSeconds,
      async () => {
        const query = this.enrollmentRepo
          .createQueryBuilder('enrollment')
          .leftJoinAndSelect('enrollment.student',      'student')
          .leftJoinAndSelect('enrollment.academicYear', 'academicYear')
          .leftJoinAndSelect('enrollment.class',        'class')
          .leftJoinAndSelect('enrollment.branch',       'branch');

        if (branchId)       query.andWhere('enrollment.branchId = :branchId',             { branchId });
        if (academicYearId) query.andWhere('enrollment.academicYearId = :academicYearId', { academicYearId });
        if (classId)        query.andWhere('enrollment.classId = :classId',               { classId });
        if (isActive !== undefined) query.andWhere('enrollment.is_active = :isActive',    { isActive });

        return query.orderBy('enrollment.createdAt', 'DESC').getMany();
      },
    );
  }

  // =========================
  // FIND ONE
  // =========================
  async findOne(id: string): Promise<Enrollment> {
    return this.cache.getOrSet(
      `enrollments:${id}`,
      this.enrollmentDetailTtlSeconds,
      () => this.findOneUncached(id),
    );
  }

  private async findOneUncached(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id },
      relations: ['student', 'academicYear', 'class', 'branch'],
    });
    if (!enrollment) throw new NotFoundException(`Enrollment with ID ${id} not found`);
    return enrollment;
  }

  // =========================
  // FIND BY STUDENT (history)
  // =========================
  async findByStudent(studentId: string): Promise<Enrollment[]> {
    return this.cache.getOrSet(
      `enrollments:student:${studentId}:history`,
      this.enrollmentStudentTtlSeconds,
      async () => {
        const student = await this.studentRepo.findOne({ where: { id: studentId } });
        if (!student) throw new NotFoundException('studentId not found');

        return this.enrollmentRepo.find({
          where: { studentId },
          relations: ['academicYear', 'class', 'branch'],
          order: { createdAt: 'DESC' },
        });
      },
    );
  }

  // =========================
  // FIND ACTIVE ENROLLMENT
  // =========================
  async findActiveByStudent(studentId: string): Promise<Enrollment | null> {
    return this.cache.getOrSet(
      `enrollments:student:${studentId}:active`,
      this.enrollmentStudentTtlSeconds,
      () =>
        this.enrollmentRepo.findOne({
          where: { studentId, is_active: true },
          relations: ['academicYear', 'class', 'branch'],
        }),
    );
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: string, dto: UpdateEnrollmentDto): Promise<Enrollment> {
    const existing = await this.findOneUncached(id);

    if (dto.classId !== undefined) {
      const cls = await this.classRepo.findOne({ where: { id: dto.classId } });
      if (!cls) throw new BadRequestException('classId not found');
      existing.classId = dto.classId;
      existing.class   = cls;
    }

    if (dto.academicYearId !== undefined) {
      const academicYear = await this.academicYearRepo.findOne({ where: { id: dto.academicYearId } });
      if (!academicYear) throw new BadRequestException('academicYearId not found');
      existing.academicYearId = dto.academicYearId;
      existing.academicYear   = academicYear;
    }

    if (dto.branchId !== undefined) {
      const branch = await this.branchRepo.findOne({ where: { id: dto.branchId } });
      if (!branch) throw new BadRequestException('branchId not found');
      existing.branchId = dto.branchId;
      existing.branch   = branch;
    }

    if (dto.is_active !== undefined) existing.is_active = dto.is_active;

    const saved = await this.enrollmentRepo.save(existing);
    await this.clearEnrollmentAffectedCaches(existing.studentId);
    return this.findOne(saved.id);
  }

  // =========================
  // PROMOTE BY CLASS (all students at once)
  // =========================
  async promoteByClass(dto: PromoteByClassDto): Promise<{
    promoted: Enrollment[];
    skipped:  { studentId: string; name: string; reason: string }[];
    summary:  { total: number; promoted: number; skipped: number };
  }> {
    const newAcademicYear = await this.academicYearRepo.findOne({ where: { id: dto.newAcademicYearId } });
    if (!newAcademicYear) throw new BadRequestException('newAcademicYearId not found');

    const newClass = await this.classRepo.findOne({ where: { id: dto.newClassId } });
    if (!newClass) throw new BadRequestException('newClassId not found');

    const currentEnrollments = await this.enrollmentRepo.find({
      where: {
        classId:        dto.currentClassId,
        academicYearId: dto.currentAcademicYearId,
        is_active:      true,
      },
      relations: ['student', 'branch', 'academicYear', 'class'],
    });

    if (!currentEnrollments.length) {
      throw new BadRequestException(
        'No active enrollments found in this class for the given academic year',
      );
    }

    const promoted: Enrollment[] = [];
    const skipped:  { studentId: string; name: string; reason: string }[] = [];
    const currentByStudentId = new Map(
      currentEnrollments.map((enrollment) => [enrollment.studentId, enrollment]),
    );
    const duplicates = await this.enrollmentRepo.find({
      where: {
        studentId: In(currentEnrollments.map((item) => item.studentId)),
        academicYearId: dto.newAcademicYearId,
      },
      select: ['id', 'studentId'],
    });
    const duplicateStudentIds = new Set(
      duplicates.map((duplicate) => duplicate.studentId),
    );

    for (const current of currentEnrollments) {
      if (duplicateStudentIds.has(current.studentId)) {
        skipped.push({
          studentId: current.studentId,
          name:      `${current.student.first_name_lao} ${current.student.last_name_lao} (${current.student.first_name_eng} ${current.student.last_name_eng})`,
          reason:    'Already enrolled in target academic year',
        });
        continue;
      }
    }

    const promotable = currentEnrollments.filter(
      (current) => !duplicateStudentIds.has(current.studentId),
    );
    if (promotable.length) {
      const savedByStudentId = await this.enrollmentRepo.manager.transaction(
        async (manager) => {
          await manager.update(
            Enrollment,
            { id: In(promotable.map((current) => current.id)) },
            { is_active: false },
          );

          return this.insertEnrollmentsBulk(
            manager.getRepository(Enrollment),
            promotable.map((current) => ({
              studentId: current.studentId,
              academicYearId: dto.newAcademicYearId,
              classId: dto.newClassId,
              branchId: current.branchId,
              is_active: true,
            })),
          );
        },
      );
      const fullPromoted = await this.findManyByIds(
        [...savedByStudentId.values()],
      );
      const fullPromotedById = new Map(
        fullPromoted.map((enrollment) => [enrollment.id, enrollment]),
      );

      for (const current of currentEnrollments) {
        if (!currentByStudentId.has(current.studentId)) continue;
        const savedId = savedByStudentId.get(current.studentId);
        const full = savedId ? fullPromotedById.get(savedId) : null;
        if (full) promoted.push(full);
      }
    }

    await this.clearEnrollmentAffectedCaches(promotable.map((item) => item.studentId));

    return {
      promoted,
      skipped,
      summary: {
        total:    currentEnrollments.length,
        promoted: promoted.length,
        skipped:  skipped.length,
      },
    };
  }

  private async findManyByIds(ids: string[]): Promise<Enrollment[]> {
    if (!ids.length) return [];
    const enrollments = await this.enrollmentRepo.find({
      where: { id: In(ids) },
      relations: ['student', 'academicYear', 'class', 'branch'],
    });
    const byId = new Map(enrollments.map((enrollment) => [enrollment.id, enrollment]));
    return ids.map((id) => byId.get(id)).filter((item): item is Enrollment => Boolean(item));
  }

  // =========================
  // PROMOTE INDIVIDUAL (one by one, each to own class)
  // ✅ Renamed from promoteStudents → promoteIndividual to avoid duplicate
  // =========================
  async promoteIndividual(dto: PromoteStudentsDto): Promise<{
    promoted: Enrollment[];
    skipped:  { studentId: string; name: string; reason: string }[];
    summary:  { total: number; promoted: number; skipped: number };
  }> {
    const newAcademicYear = await this.academicYearRepo.findOne({ where: { id: dto.newAcademicYearId } });
    if (!newAcademicYear) throw new BadRequestException('newAcademicYearId not found');

    const studentIds = dto.students.map((item) => item.studentId);
    const classIds = Array.from(new Set(dto.students.map((item) => item.newClassId)));
    const [currentEnrollments, targetClasses, duplicates] = await Promise.all([
      studentIds.length
        ? this.enrollmentRepo.find({
            where: { studentId: In(studentIds), is_active: true },
            relations: ['student', 'branch'],
          })
        : Promise.resolve([]),
      classIds.length
        ? this.classRepo.find({ where: { id: In(classIds) } })
        : Promise.resolve([]),
      studentIds.length
        ? this.enrollmentRepo.find({
            where: {
              studentId: In(studentIds),
              academicYearId: dto.newAcademicYearId,
            },
          })
        : Promise.resolve([]),
    ]);

    const currentByStudentId = new Map(
      currentEnrollments.map((enrollment) => [enrollment.studentId, enrollment]),
    );
    const classById = new Map(targetClasses.map((item) => [item.id, item]));
    const duplicateByStudentId = new Map(
      duplicates.map((enrollment) => [enrollment.studentId, enrollment]),
    );

    const promoted: Enrollment[] = [];
    const skipped:  { studentId: string; name: string; reason: string }[] = [];
    const currentDeactivateIds = new Set<string>();
    const duplicateUpdates: { id: string; studentId: string; classId: string }[] = [];
    const newEnrollments: {
      studentId: string;
      academicYearId: string;
      classId: string;
      branchId: string;
      is_active: boolean;
    }[] = [];
    const promotedStudentIdsInOrder: string[] = [];
    const promotedEnrollmentIdByStudentId = new Map<string, string>();

    for (const item of dto.students) {
      const current = currentByStudentId.get(item.studentId);
      if (!current) {
        skipped.push({ studentId: item.studentId, name: 'Unknown', reason: 'No active enrollment found' });
        continue;
      }

      const newClass = classById.get(item.newClassId);
      if (!newClass) {
        skipped.push({
          studentId: item.studentId,
          name:      `${current.student.first_name_lao} ${current.student.last_name_lao} (${current.student.first_name_eng} ${current.student.last_name_eng})`,
          reason:    `newClassId not found: ${item.newClassId}`,
        });
        continue;
      }

      const duplicate = duplicateByStudentId.get(item.studentId);
      if (duplicate) {
        if (duplicate.classId === item.newClassId && duplicate.is_active) {
          skipped.push({
            studentId: item.studentId,
            name: `${current.student?.first_name_lao || ''} ${current.student?.last_name_lao || ''}`.trim() || 'Student',
            reason: 'Already enrolled in target class for this academic year',
          });
          continue;
        }

        if (current.id !== duplicate.id) {
          currentDeactivateIds.add(current.id);
        }

        duplicateUpdates.push({
          id: duplicate.id,
          studentId: item.studentId,
          classId: item.newClassId,
        });
        promotedStudentIdsInOrder.push(item.studentId);
        promotedEnrollmentIdByStudentId.set(item.studentId, duplicate.id);
        continue;
      }

      currentDeactivateIds.add(current.id);
      newEnrollments.push({
        studentId: item.studentId,
        academicYearId: dto.newAcademicYearId,
        classId: item.newClassId,
        branchId: current.branchId,
        is_active: true,
      });
      promotedStudentIdsInOrder.push(item.studentId);
    }

    await this.enrollmentRepo.manager.transaction(async (manager) => {
      if (currentDeactivateIds.size) {
        await manager.update(
          Enrollment,
          { id: In([...currentDeactivateIds]) },
          { is_active: false },
        );
      }

      if (duplicateUpdates.length) {
        await this.updateDuplicateEnrollmentsBulk(
          manager.getRepository(Enrollment),
          duplicateUpdates,
        );
      }

      if (newEnrollments.length) {
        const savedByStudentId = await this.insertEnrollmentsBulk(
          manager.getRepository(Enrollment),
          newEnrollments,
        );
        for (const [studentId, enrollmentId] of savedByStudentId) {
          promotedEnrollmentIdByStudentId.set(studentId, enrollmentId);
        }
      }
    });

    const promotedIdsInOrder = promotedStudentIdsInOrder
      .map((studentId) => promotedEnrollmentIdByStudentId.get(studentId))
      .filter((id): id is string => Boolean(id));
    promoted.push(...(await this.findManyByIds(promotedIdsInOrder)));
    await this.clearEnrollmentAffectedCaches(promotedStudentIdsInOrder);

    return {
      promoted,
      skipped,
      summary: {
        total:    dto.students.length,
        promoted: promoted.length,
        skipped:  skipped.length,
      },
    };
  }

  // =========================
  // REMOVE
  // =========================
  async remove(id: string): Promise<{ message: string }> {
    const enrollment = await this.findOneUncached(id);
    await this.enrollmentRepo.remove(enrollment);
    await this.clearEnrollmentAffectedCaches(enrollment.studentId);
    return { message: 'Enrollment deleted successfully' };
  }

  private async insertEnrollmentsBulk(
    repo: Repository<Enrollment>,
    rows: {
      studentId: string;
      academicYearId: string;
      classId: string;
      branchId: string;
      is_active: boolean;
    }[],
  ): Promise<Map<string, string>> {
    if (!rows.length) return new Map();
    const result = await repo
      .createQueryBuilder()
      .insert()
      .into(Enrollment)
      .values(rows)
      .returning(['id'])
      .execute();

    return new Map(
      result.identifiers
        .map((identifier, index) => {
          const id = identifier.id;
          const studentId = rows[index]?.studentId;
          return id && studentId ? [studentId, id] : null;
        })
        .filter((item): item is [string, string] => Boolean(item)),
    );
  }

  private async updateDuplicateEnrollmentsBulk(
    repo: Repository<Enrollment>,
    updates: { id: string; classId: string }[],
  ): Promise<void> {
    if (!updates.length) return;
    const groupedByClassId = new Map<string, string[]>();
    for (const update of updates) {
      const ids = groupedByClassId.get(update.classId);
      if (ids) ids.push(update.id);
      else groupedByClassId.set(update.classId, [update.id]);
    }

    for (const [classId, ids] of groupedByClassId) {
      await repo.update({ id: In(ids) }, { classId, is_active: true });
    }
  }

  private async clearEnrollmentAffectedCaches(
    studentIds: string | string[],
  ): Promise<void> {
    const ids = Array.isArray(studentIds) ? studentIds : [studentIds];
    await Promise.all([
      this.cache.delPattern('students:*'),
      this.cache.delPattern('parents:*'),
      this.cache.delPattern('enrollments:*'),
      ...ids.map((id) => this.cache.delPattern(`student:${id}:*`)),
    ]);
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
