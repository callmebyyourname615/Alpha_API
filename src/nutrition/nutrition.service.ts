import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';
import { Student }          from '../students/student.entity';
import { StudentNutrition } from './nutrition.entity';
import { CreateStudentNutritionDto, UpdateStudentNutritionDto } from './dto/nutrition.dto';

@Injectable()
export class StudentNutritionService {
  constructor(
    @InjectRepository(StudentNutrition)
    private readonly repo: Repository<StudentNutrition>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private withRelations() {
    return {
      student:      true,
      branch:       true,
      academicYear: true,
      recordedBy:   true,
    } as const;
  }

  private async guardStudent(studentId: string): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, is_deleted: false },
    });
    if (!student) throw new NotFoundException(`Student "${studentId}" not found`);
    return student;
  }

  private guardNotDeleted(record: StudentNutrition): void {
    if (record.is_deleted)
      throw new BadRequestException('This record has been deleted');
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async create(dto: CreateStudentNutritionDto): Promise<StudentNutrition> {
    await this.guardStudent(dto.studentId);

    const record = this.repo.create({
      studentId:              dto.studentId,
      branchId:               dto.branchId               ?? null,
      academic_year_id:       dto.academic_year_id        ?? null,
      recordedById:           dto.recordedById            ?? null,
      measurement_date:       dto.measurement_date,
      weight_kg:              dto.weight_kg,
      height_cm:              dto.height_cm,
      // bmi auto-computed in @BeforeInsert
      muac_cm:                dto.muac_cm                 ?? null,
      head_circumference_cm:  dto.head_circumference_cm   ?? null,
      nutritional_status:     dto.nutritional_status      ?? null,
      wasting_status:         dto.wasting_status          ?? null,
      vitamin_a_given:        dto.vitamin_a_given         ?? false,
      iron_given:             dto.iron_given              ?? false,
      round_number:           dto.round_number,
      next_screening_date:    dto.next_screening_date     ?? null,
      referred_for_treatment: dto.referred_for_treatment  ?? false,
      note:                   dto.note                    ?? null,
      is_active:              true,
      is_deleted:             false,
    });

    return this.repo.save(record);
  }

  // ─── READ ALL ──────────────────────────────────────────────────────────────

  async findAll(): Promise<StudentNutrition[]> {
    return this.repo.find({
      where:     { is_deleted: false },
      relations: this.withRelations(),
      order:     { measurement_date: 'DESC' },
    });
  }

  // ─── READ BY STUDENT ───────────────────────────────────────────────────────

  async findByStudent(studentId: string): Promise<StudentNutrition[]> {
    await this.guardStudent(studentId);
    return this.repo.find({
      where:     { studentId, is_deleted: false },
      relations: this.withRelations(),
      order:     { measurement_date: 'DESC', round_number: 'DESC' },
    });
  }

  // ─── READ ONE ──────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<StudentNutrition> {
    const record = await this.repo.findOne({
      where:     { id, is_deleted: false },
      relations: this.withRelations(),
    });
    if (!record) throw new NotFoundException(`Nutrition record "${id}" not found`);
    return record;
  }

  // ─── LATEST RECORD PER STUDENT IN A BRANCH ─────────────────────────────────
  // Useful for dashboard — returns the most recent record per student

  async findLatestByBranch(branchId: string): Promise<StudentNutrition[]> {
    return this.repo
      .createQueryBuilder('n')
      .innerJoinAndSelect('n.student',      'student')
      .leftJoinAndSelect('n.branch',        'branch')
      .leftJoinAndSelect('n.academicYear',  'academicYear')
      .leftJoinAndSelect('n.recordedBy',    'recordedBy')
      .where('n.branch_id = :branchId', { branchId })
      .andWhere('n.is_deleted = false')
      .andWhere(
        `n.measurement_date = (
          SELECT MAX(n2.measurement_date)
          FROM student_nutritions n2
          WHERE n2.student_id = n.student_id
            AND n2.branch_id  = :branchId
            AND n2.is_deleted = false
        )`,
        { branchId },
      )
      .orderBy('n.measurement_date', 'DESC')
      .getMany();
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateStudentNutritionDto,
  ): Promise<StudentNutrition> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);

    Object.assign(record, {
      branchId:               dto.branchId               ?? record.branchId,
      academic_year_id:       dto.academic_year_id        ?? record.academic_year_id,
      recordedById:           dto.recordedById            ?? record.recordedById,
      measurement_date:       dto.measurement_date        ?? record.measurement_date,
      weight_kg:              dto.weight_kg               ?? record.weight_kg,
      height_cm:              dto.height_cm               ?? record.height_cm,
      muac_cm:                dto.muac_cm                 ?? record.muac_cm,
      head_circumference_cm:  dto.head_circumference_cm   ?? record.head_circumference_cm,
      nutritional_status:     dto.nutritional_status      ?? record.nutritional_status,
      wasting_status:         dto.wasting_status          ?? record.wasting_status,
      vitamin_a_given:        dto.vitamin_a_given         ?? record.vitamin_a_given,
      iron_given:             dto.iron_given              ?? record.iron_given,
      round_number:           dto.round_number            ?? record.round_number,
      next_screening_date:    dto.next_screening_date     ?? record.next_screening_date,
      referred_for_treatment: dto.referred_for_treatment  ?? record.referred_for_treatment,
      note:                   dto.note                    ?? record.note,
    });

    // @BeforeUpdate re-computes BMI + status when weight/height changed
    return this.repo.save(record);
  }

  // ─── SOFT DELETE ───────────────────────────────────────────────────────────

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    record.is_deleted = true;
    record.is_active  = false;
    await this.repo.save(record);
    return { message: `Nutrition record "${id}" deleted successfully` };
  }
}