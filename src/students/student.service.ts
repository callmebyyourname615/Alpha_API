import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Student } from './student.entity';
import { Parent } from '../parents/parent.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateEnrollmentDto } from '../enrollments/dto/create-enrollment.dto';
import { SearchStudentByClassDto } from './dto/search-students.dto';
import { Branch } from '../branches/branch.entity';
import { Province } from '../location/province.entity';
import { District } from '../location/district.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(Parent)
    private readonly parentRepo: Repository<Parent>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  // ─── Duplicate guard ──────────────────────────────────────────────────
  // "Duplicate" = same parent + matching full name (Lao OR English) + same
  // dob. Scoped to one parent because names/dobs alone aren't unique across
  // the whole school, but a parent registering the same child twice under
  // both names matching is effectively certain.
  private normalizeName(first?: string | null, last?: string | null): string {
    return `${first ?? ''} ${last ?? ''}`
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  private displayName(s: Student): string {
    const lao = this.normalizeName(s.first_name_lao, s.last_name_lao);
    if (lao) return `${s.first_name_lao ?? ''} ${s.last_name_lao ?? ''}`.trim();
    return `${s.first_name_eng ?? ''} ${s.last_name_eng ?? ''}`.trim();
  }

  private async findPossibleDuplicates(
    dto: CreateStudentDto,
  ): Promise<Student[]> {
    if (!dto.parentIds?.length || !dto.dob) return [];

    const laoFull = this.normalizeName(dto.first_name_lao, dto.last_name_lao);
    const engFull = this.normalizeName(dto.first_name_eng, dto.last_name_eng);
    if (!laoFull && !engFull) return [];

    const candidates = await this.studentRepo
      .createQueryBuilder('student')
      .innerJoin('student.parents', 'parent')
      .where('parent.id IN (:...parentIds)', { parentIds: dto.parentIds })
      .andWhere('student.dob = :dob', { dob: new Date(dto.dob) })
      .andWhere('student.is_deleted = false')
      .getMany();

    return candidates.filter((c) => {
      const candidateLao = this.normalizeName(
        c.first_name_lao,
        c.last_name_lao,
      );
      const candidateEng = this.normalizeName(
        c.first_name_eng,
        c.last_name_eng,
      );
      return (
        (!!laoFull && laoFull === candidateLao) ||
        (!!engFull && engFull === candidateEng)
      );
    });
  }

  // ─── Create Student ───────────────────────────────────────────────────
  async createStudent(dto: CreateStudentDto): Promise<Student> {
    if (!dto.confirmDuplicate) {
      const duplicates = await this.findPossibleDuplicates(dto);
      if (duplicates.length) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message:
            'A student with this name and date of birth is already registered under this account.',
          possibleDuplicates: duplicates.map((d) => ({
            id: d.id,
            name: this.displayName(d),
            dob: d.dob,
          })),
        });
      }
    }

    const student = this.studentRepo.create({
      branch: dto.branchId ? ({ id: dto.branchId } as Branch) : null,
      province: dto.provinceId ? ({ id: dto.provinceId } as Province) : null,
      district: dto.districtId ? ({ id: dto.districtId } as District) : null,
      province_db: dto.provinceDbId ? ({ id: dto.provinceDbId } as Province) : null,
      district_db: dto.districtDbId ? ({ id: dto.districtDbId } as District) : null,

      student_id: dto.student_id,
      profile_image_path: dto.profile_image_path,
      image_passport: dto.image_passport,
      image_url: dto.image_url,
      first_name_lao: dto.first_name_lao,
      first_name_eng: dto.first_name_eng,
      midle_name_lao: dto.midle_name_lao,
      midle_name_eng: dto.midle_name_eng,
      last_name_lao: dto.last_name_lao,
      last_name_eng: dto.last_name_eng,
      nickname: dto.nickname,
      dob: new Date(dto.dob),
      gender: dto.gender,
      dm_birth: dto.dm_birth,
      passport_number: dto.passport_number,
      nationality: dto.nationality,
      ethnicity: dto.ethnicity,
      religion: dto.religion,
      village: dto.village,
      address: dto.address,
      parent_address: dto.parent_address,
      home_map: dto.home_map,
      village_bd: dto.village_bd,
      Siblings_number: (dto as any).Siblings_number,

      live_with: dto.live_with ?? [],
      emergency_contacts: dto.emergency_contacts ?? [],
      Siblings_info: (dto as any).Siblings_info ?? [],
      his_school_nursery: dto.his_school_nursery ?? [],
      his_school_kindergarten: dto.his_school_kindergarten ?? [],
      his_school_primary: dto.his_school_primary ?? [],
      health_history: (dto as any).health_history ?? [],

      saving_wallet: 0,
      is_active: false,
      is_deleted: false,
    });

    const saved = await this.studentRepo.save(student);

    if (dto.parentIds?.length) {
      await this.linkParents(saved.id, dto.parentIds);
    }

    return this.findById(saved.id);
  }

  // ─── Link Parents ─────────────────────────────────────────────────────
  async linkParents(studentId: string, parentIds: string[]): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['parents'],
    });

    if (!student) throw new NotFoundException('Student not found');

    const parents = await this.parentRepo.find({
      where: { id: In(parentIds) },
    });

    if (parents.length !== parentIds.length) {
      throw new NotFoundException('One or more parents not found');
    }

    student.parents = parents;
    return this.studentRepo.save(student);
  }

  // ─── Enroll Student ───────────────────────────────────────────────────
  async enrollStudent(dto: CreateEnrollmentDto): Promise<Enrollment> {
    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
    });

    if (!student) throw new NotFoundException('Student not found');

    const existing = await this.enrollmentRepo.findOne({
      where: {
        studentId: dto.studentId,
        academicYearId: dto.academicYearId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Student is already enrolled in this academic year',
      );
    }

    const enrollment = this.enrollmentRepo.create({
      student: { id: dto.studentId },
      academicYear: { id: dto.academicYearId },
      class: { id: dto.classId },
      branch: { id: dto.branchId },
      is_active: dto.is_active ?? true,
    });

    return this.enrollmentRepo.save(enrollment);
  }

  // ─── Find By ID ───────────────────────────────────────────────────────
  async findById(id: string): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: [
        'branch',
        'province',
        'district',
        'province_db',
        'district_db',
        'parents',
        'enrollments',
      ],
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  // ─── Find All ─────────────────────────────────────────────────────────
  async findAll(): Promise<Student[]> {
    return this.studentRepo.find({
      where: { is_deleted: false },
      relations: [
        'branch',
        'province',
        'district',
        'province_db',
        'district_db',
        'parents',
        'enrollments',
      ],
    });
  }

  // ─── Update Student ───────────────────────────────────────────────────
  async updateStudent(
    id: string,
    dto: Partial<CreateStudentDto>,
  ): Promise<Student> {
    const student = await this.findById(id);

    Object.assign(student, {
      branch: dto.branchId
        ? ({ id: dto.branchId } as Branch)
        : student.branch,
      province: dto.provinceId
        ? ({ id: dto.provinceId } as Province)
        : student.province,
      district: dto.districtId
        ? ({ id: dto.districtId } as District)
        : student.district,
      province_db: dto.provinceDbId
        ? ({ id: dto.provinceDbId } as Province)
        : student.province_db,
      district_db: dto.districtDbId
        ? ({ id: dto.districtDbId } as District)
        : student.district_db,

      student_id: dto.student_id ?? student.student_id,
      profile_image_path: dto.profile_image_path ?? student.profile_image_path,
      image_passport: dto.image_passport ?? student.image_passport,
      image_url: dto.image_url ?? student.image_url,
      first_name_lao: dto.first_name_lao ?? student.first_name_lao,
      first_name_eng: dto.first_name_eng ?? student.first_name_eng,
      midle_name_lao: dto.midle_name_lao ?? student.midle_name_lao,
      midle_name_eng: dto.midle_name_eng ?? student.midle_name_eng,
      last_name_lao: dto.last_name_lao ?? student.last_name_lao,
      last_name_eng: dto.last_name_eng ?? student.last_name_eng,
      nickname: dto.nickname ?? student.nickname,
      dob: dto.dob ? new Date(dto.dob) : student.dob,
      gender: dto.gender ?? student.gender,
      dm_birth: dto.dm_birth ?? student.dm_birth,
      passport_number: dto.passport_number ?? student.passport_number,
      nationality: dto.nationality ?? student.nationality,
      ethnicity: dto.ethnicity ?? student.ethnicity,
      religion: dto.religion ?? student.religion,
      village: dto.village ?? student.village,
      address: dto.address ?? student.address,
      parent_address: dto.parent_address ?? student.parent_address,
      home_map: dto.home_map ?? student.home_map,
      village_bd: dto.village_bd ?? student.village_bd,
      Siblings_number: (dto as any).Siblings_number ?? student.Siblings_number,

      live_with: dto.live_with ?? student.live_with,
      emergency_contacts: dto.emergency_contacts ?? student.emergency_contacts,

      Siblings_info: (dto as any).Siblings_info ?? student.Siblings_info,
      his_school_kindergarten:
        dto.his_school_kindergarten ?? student.his_school_kindergarten,
      his_school_primary: dto.his_school_primary ?? student.his_school_primary,
      health_history: (dto as any).health_history ?? student.health_history,
      physical_disability:
        (dto as any).physical_disability ?? student.physical_disability,
      protective_info: (dto as any).protective_info ?? student.protective_info,

      // Approval flag — admin's Approve button hits this endpoint with
      // { is_active: true }. Without this line the DTO field was silently
      // dropped, the response still showed the old value, and the parent
      // app's polling never saw the approval.
      is_active: dto.is_active ?? student.is_active,
    });

    // Approval workflow side-effects. Some admin flows still approve by sending
    // only { is_active: true }, so keep the persisted approval status in sync
    // with the active flag instead of leaving old pending values behind.
    if (dto.approval_status !== undefined) {
      student.approvalStatus = dto.approval_status;
      if (dto.approval_status === 'approved') {
        student.is_active = true;
        student.rejectedAt = null;
        student.rejectReason = null;
      } else if (dto.approval_status === 'rejected') {
        student.rejectedAt = new Date();
        student.rejectReason = (dto.reject_reason ?? '').trim() || null;
        student.is_active = false;
      } else {
        student.rejectedAt = null;
        student.rejectReason = null;
      }
    } else if (dto.is_active === true) {
      student.approvalStatus = 'approved';
      student.rejectedAt = null;
      student.rejectReason = null;
    } else if (dto.reject_reason !== undefined) {
      student.rejectReason = dto.reject_reason.trim() || null;
    }

    const updated = await this.studentRepo.save(student);

    if (dto.parentIds?.length) {
      await this.linkParents(id, dto.parentIds);
    }

    return this.findById(updated.id);
  }

  // ─── Update LiveWith nested images by index ───────────────────────────
  async updateLiveWithImages(
    id: string,
    index: number,
    patch: Partial<{
      id_card_image_url: string;
      passport_image_url: string;
      profile_image: string;
    }>,
  ): Promise<Student> {
    const student = await this.findById(id);

    const list = student.live_with ?? [];
    if (index < 0 || index >= list.length) {
      throw new BadRequestException(
        `live_with index ${index} out of range (length: ${list.length})`,
      );
    }

    list[index] = { ...list[index], ...patch };
    student.live_with = list;

    await this.studentRepo.save(student);
    return this.findById(id);
  }

  // ─── Update BosInfo image by index ───────────────────────────────────
  async updateBosInfoImage(
    id: string,
    index: number,
    imagePath: string,
  ): Promise<Student> {
    const student = await this.findById(id);

    await this.studentRepo.save(student);
    return this.findById(id);
  }

  // ─── Update SiblingsInfo image by index ────────────────────────────────
  async updateSiblingsInfoImage(
    id: string,
    index: number,
    imagePath: string,
  ): Promise<Student> {
    const student = await this.findById(id);

    const list = student.Siblings_info ?? [];
    if (index < 0 || index >= list.length) {
      throw new BadRequestException(
        `Siblings_info index ${index} out of range (length: ${list.length})`,
      );
    }

    list[index] = { ...list[index], image_url: imagePath };
    student.Siblings_info = list;

    await this.studentRepo.save(student);
    return this.findById(id);
  }

  // ─── Find By Class ────────────────────────────────────────────────────
  async findByClass(dto: SearchStudentByClassDto): Promise<Student[]> {
    const enrollments = await this.enrollmentRepo.find({
      where: {
        classId: In(dto.classIds),
        ...(dto.isActive !== undefined
          ? { is_active: dto.isActive }
          : { is_active: true }),
      },
      select: ['studentId'],
    });

    const studentIds = [...new Set(enrollments.map((e) => e.studentId))];
    if (studentIds.length === 0) return [];

    return this.studentRepo.find({
      where: { id: In(studentIds), is_deleted: false },
      relations: [
        'branch',
        'province',
        'district',
        'province_db',
        'district_db',
        'parents',
        'enrollments',
        'enrollments.class',
      ],
      order: {
        first_name_lao: 'ASC',
        last_name_lao: 'ASC',
        first_name_eng: 'ASC',
        last_name_eng: 'ASC',
      },
    });
  }

  // ─── Delete Student (soft) ────────────────────────────────────────────
  async deleteStudent(id: string): Promise<{ message: string }> {
    const student = await this.findById(id);
    student.is_deleted = true;
    student.is_active = false;
    await this.studentRepo.save(student);
    return { message: `Student ${id} deleted successfully` };
  }
}
