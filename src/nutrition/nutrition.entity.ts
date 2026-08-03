import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { Student }      from '../students/student.entity';
import { Branch }       from '../branches/branch.entity';
import { Admin }        from '../admins/admin.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';

// =========================
// ENUMS
// =========================

export enum NutritionalStatus {
  SEVERELY_UNDERWEIGHT = 'severely_underweight',
  UNDERWEIGHT          = 'underweight',
  NORMAL               = 'normal',
  OVERWEIGHT           = 'overweight',
  OBESE                = 'obese',
}

export enum WastingStatus {
  SEVERE   = 'severe',    // MUAC < 11.5 cm
  MODERATE = 'moderate',  // MUAC 11.5–12.5 cm
  NORMAL   = 'normal',    // MUAC > 12.5 cm
}

// =========================
// ENTITY
// =========================

@Entity('student_nutritions')
@Index('idx_nutrition_student_id',   ['studentId'])
@Index('idx_nutrition_measure_date', ['measurement_date'])
@Index('idx_nutrition_round',        ['studentId', 'academic_year_id', 'round_number'])
export class StudentNutrition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // =========================
  // FK: Student
  // =========================
  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  // =========================
  // FK: Branch (optional)
  // =========================
  @Column('uuid', { name: 'branch_id', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  // =========================
  // FK: Academic year (optional)
  // =========================
  @Column('uuid', { name: 'academic_year_id', nullable: true })
  academic_year_id: string | null;

  @ManyToOne(() => AcademicYear, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear | null;

  // =========================
  // FK: Admin who recorded
  // =========================
  @Column('uuid', { name: 'recorded_by', nullable: true })
  recordedById: string | null;

  @ManyToOne(() => Admin, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recorded_by' })
  recordedBy: Admin | null;

  // =========================
  // MEASUREMENTS
  // =========================

  @Column({ type: 'date' })
  measurement_date: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  weight_kg: number;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  height_cm: number;

  // Auto-computed from weight and height in @BeforeInsert / @BeforeUpdate
  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  bmi: number | null;

  // Mid-upper arm circumference — WHO acute malnutrition indicator
  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  muac_cm: number | null;

  // Head circumference — mainly for under-5 children
  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  head_circumference_cm: number | null;

  // =========================
  // NUTRITIONAL STATUS
  // =========================

  // Auto-derived from BMI on save — can also be set manually
  @Column({
    type: 'enum',
    enum: NutritionalStatus,
    nullable: true,
    default: NutritionalStatus.NORMAL,
  })
  nutritional_status: NutritionalStatus | null;

  // Derived from MUAC (acute malnutrition indicator)
  @Column({
    type: 'enum',
    enum: WastingStatus,
    nullable: true,
    default: WastingStatus.NORMAL,
  })
  wasting_status: WastingStatus | null;

  @Column({ default: false })
  vitamin_a_given: boolean;

  @Column({ default: false })
  iron_given: boolean;

  // =========================
  // TRACKING
  // =========================

  @Column({ type: 'int', default: 1 })
  round_number: number;

  @Column({ type: 'date', nullable: true })
  next_screening_date: string | null;

  @Column({ default: false })
  referred_for_treatment: boolean;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  // =========================
  // STATUS
  // =========================

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  // =========================
  // TIMESTAMPS
  // =========================

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // =========================
  // AUTO-COMPUTE on save
  // =========================

  @BeforeInsert()
  @BeforeUpdate()
  computeFields() {
    // 1. BMI
    if (this.weight_kg && this.height_cm) {
      const h = Number(this.height_cm) / 100;
      this.bmi = Math.round((Number(this.weight_kg) / (h * h)) * 100) / 100;
    }

    // 2. Nutritional status from BMI
    //    Uses simplified cut-offs; for production use age-specific WHO z-score tables
    if (this.bmi !== null && this.bmi !== undefined) {
      const bmi = Number(this.bmi);
      if      (bmi < 14) this.nutritional_status = NutritionalStatus.SEVERELY_UNDERWEIGHT;
      else if (bmi < 16) this.nutritional_status = NutritionalStatus.UNDERWEIGHT;
      else if (bmi < 25) this.nutritional_status = NutritionalStatus.NORMAL;
      else if (bmi < 30) this.nutritional_status = NutritionalStatus.OVERWEIGHT;
      else               this.nutritional_status = NutritionalStatus.OBESE;
    }

    // 3. Wasting status from MUAC
    if (this.muac_cm !== null && this.muac_cm !== undefined) {
      const muac = Number(this.muac_cm);
      if      (muac < 11.5) this.wasting_status = WastingStatus.SEVERE;
      else if (muac < 12.5) this.wasting_status = WastingStatus.MODERATE;
      else                  this.wasting_status = WastingStatus.NORMAL;
    }
  }
}