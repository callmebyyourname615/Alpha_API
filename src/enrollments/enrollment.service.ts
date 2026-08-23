import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { Student } from '../students/student.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Class } from '../classes/class.entity';
import { Branch } from '../branches/branch.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { PromoteByClassDto, PromoteStudentsDto } from './dto/promote-students.dto';

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
  ) {}

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
  }

  // =========================
  // FIND ONE
  // =========================
  async findOne(id: string): Promise<Enrollment> {
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
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('studentId not found');

    return this.enrollmentRepo.find({
      where: { studentId },
      relations: ['academicYear', 'class', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  // =========================
  // FIND ACTIVE ENROLLMENT
  // =========================
  async findActiveByStudent(studentId: string): Promise<Enrollment | null> {
    return this.enrollmentRepo.findOne({
      where: { studentId, is_active: true },
      relations: ['academicYear', 'class', 'branch'],
    });
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: string, dto: UpdateEnrollmentDto): Promise<Enrollment> {
    const existing = await this.findOne(id);

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

    for (const current of currentEnrollments) {
      const duplicate = await this.enrollmentRepo.findOne({
        where: { studentId: current.studentId, academicYearId: dto.newAcademicYearId },
      });

      if (duplicate) {
        skipped.push({
          studentId: current.studentId,
          name:      `${current.student.first_name_lao} ${current.student.last_name_lao} (${current.student.first_name_eng} ${current.student.last_name_eng})`,
          reason:    'Already enrolled in target academic year',
        });
        continue;
      }

      current.is_active = false;
      await this.enrollmentRepo.save(current);

      const newEnrollment = this.enrollmentRepo.create({
        studentId:      current.studentId,      student:      current.student,
        academicYearId: dto.newAcademicYearId,  academicYear: newAcademicYear,
        classId:        dto.newClassId,          class:        newClass,
        branchId:       current.branchId,        branch:       current.branch,
        is_active:      true,
      });

      const saved = await this.enrollmentRepo.save(newEnrollment);
      promoted.push(await this.findOne(saved.id));
    }

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

    const promoted: Enrollment[] = [];
    const skipped:  { studentId: string; name: string; reason: string }[] = [];

    for (const item of dto.students) {
      const current = await this.enrollmentRepo.findOne({
        where: { studentId: item.studentId, is_active: true },
        relations: ['student', 'branch'],
      });

      if (!current) {
        skipped.push({ studentId: item.studentId, name: 'Unknown', reason: 'No active enrollment found' });
        continue;
      }

      const newClass = await this.classRepo.findOne({ where: { id: item.newClassId } });
      if (!newClass) {
        skipped.push({
          studentId: item.studentId,
          name:      `${current.student.first_name_lao} ${current.student.last_name_lao} (${current.student.first_name_eng} ${current.student.last_name_eng})`,
          reason:    `newClassId not found: ${item.newClassId}`,
        });
        continue;
      }

      const duplicate = await this.enrollmentRepo.findOne({
        where: { studentId: item.studentId, academicYearId: dto.newAcademicYearId },
      });

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
          current.is_active = false;
          await this.enrollmentRepo.save(current);
        }

        duplicate.classId = item.newClassId;
        duplicate.class = newClass;
        duplicate.is_active = true;
        const saved = await this.enrollmentRepo.save(duplicate);
        promoted.push(await this.findOne(saved.id));
        continue;
      }

      current.is_active = false;
      await this.enrollmentRepo.save(current);

      const newEnrollment = this.enrollmentRepo.create({
        studentId:      item.studentId,         student:      current.student,
        academicYearId: dto.newAcademicYearId,  academicYear: newAcademicYear,
        classId:        item.newClassId,         class:        newClass,
        branchId:       current.branchId,        branch:       current.branch,
        is_active:      true,
      });

      const saved = await this.enrollmentRepo.save(newEnrollment);
      promoted.push(await this.findOne(saved.id));
    }

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
    const enrollment = await this.findOne(id);
    await this.enrollmentRepo.remove(enrollment);
    return { message: 'Enrollment deleted successfully' };
  }
}