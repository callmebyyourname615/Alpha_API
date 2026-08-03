import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ParasiteInjection,
  InjectionStatus,
} from './parasite.injection.entity';
import {
  CreateParasiteInjectionDto,
  UpdateParasiteInjectionDto,
} from './dto/parasite.injection.dto';
import { Student } from '../students/student.entity';

@Injectable()
export class ParasiteInjectionService {
  constructor(
    @InjectRepository(ParasiteInjection)
    private readonly repo: Repository<ParasiteInjection>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  // ─── Relations helper ──────────────────────────────────────────────────────

private withRelations() {
  return {
    student: true,
    class: true,
    branch: true,
    academicYear: true,
    administeredBy: true,
  } as const;
}

  // ─── Guard helpers ─────────────────────────────────────────────────────────

  private async guardStudent(studentId: string): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, is_deleted: false },
    });
    if (!student) throw new NotFoundException(`Student "${studentId}" not found`);
    return student;
  }

  private guardNotDeleted(record: ParasiteInjection): void {
    if (record.is_deleted)
      throw new BadRequestException('This record has been deleted');
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async create(dto: CreateParasiteInjectionDto): Promise<ParasiteInjection> {
    await this.guardStudent(dto.studentId);

    const record = this.repo.create({
  ...dto,

  classId: dto.classId ?? null,

  branchId: dto.branchId ?? null,
  academicYearId: dto.academicYearId ?? null,
  administeredById: dto.administeredById ?? null,

  drug_form: dto.drug_form ?? null,
  batch_number: dto.batch_number ?? null,
  expiry_date: dto.expiry_date ?? null,

  next_due_date: dto.next_due_date ?? null,
  treatment_program: dto.treatment_program ?? null,

  reaction: dto.reaction ?? null,
  reaction_detail: dto.reaction_detail ?? null,

  weight_kg: dto.weight_kg ?? null,
  note: dto.note ?? null,

  status: dto.status ?? InjectionStatus.COMPLETED,

  is_active: true,
  is_deleted: false,
}) as ParasiteInjection;

    return this.repo.save(record);
  }

  // ─── READ ALL ──────────────────────────────────────────────────────────────

  async findAll(): Promise<ParasiteInjection[]> {
    return this.repo.find({
      where:   { is_deleted: false },
      relations: this.withRelations(),
      order:   { administered_date: 'DESC' },
    });
  }

  // ─── READ BY STUDENT ───────────────────────────────────────────────────────
  // Returns all injection history for a student, newest first.

  async findByStudent(studentId: string): Promise<ParasiteInjection[]> {
    await this.guardStudent(studentId);
    return this.repo.find({
      where:     { studentId, is_deleted: false },
      relations: this.withRelations(),
      order:     { administered_date: 'DESC', round_number: 'DESC' },
    });
  }

  // ─── READ ONE ──────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<ParasiteInjection> {
    const record = await this.repo.findOne({
      where:     { id, is_deleted: false },
      relations: this.withRelations(),
    });
    if (!record) throw new NotFoundException(`Record "${id}" not found`);
    return record;
  }

  // ─── READ BY CLASS ───────────────────────────────────────────────────────
// Returns all parasite injection history for students in a class

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateParasiteInjectionDto,
  ): Promise<ParasiteInjection> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);

   Object.assign(record, {
  classId: dto.classId ?? record.classId,

  branchId: dto.branchId ?? record.branchId,
  academicYearId: dto.academicYearId ?? record.academicYearId,
  administeredById: dto.administeredById ?? record.administeredById,

  parasite_type: dto.parasite_type ?? record.parasite_type,
  drug_name: dto.drug_name ?? record.drug_name,
  dosage: dto.dosage ?? record.dosage,
  drug_form: dto.drug_form ?? record.drug_form,
  batch_number: dto.batch_number ?? record.batch_number,
  expiry_date: dto.expiry_date ?? record.expiry_date,

  administered_date: dto.administered_date ?? record.administered_date,
  round_number: dto.round_number ?? record.round_number,
  next_due_date: dto.next_due_date ?? record.next_due_date,

  treatment_program: dto.treatment_program ?? record.treatment_program,

  reaction: dto.reaction ?? record.reaction,
  reaction_detail: dto.reaction_detail ?? record.reaction_detail,

  weight_kg: dto.weight_kg ?? record.weight_kg,
  note: dto.note ?? record.note,

  status: dto.status ?? record.status,
});

    return this.repo.save(record);
  }

  // ─── SOFT DELETE ───────────────────────────────────────────────────────────

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    record.is_deleted = true;
    record.is_active  = false;
    await this.repo.save(record);
    return { message: `Parasite injection record "${id}" deleted successfully` };
  }
}
