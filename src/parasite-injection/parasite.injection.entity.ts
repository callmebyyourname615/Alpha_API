import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Student } from '../students/student.entity';
import { Branch } from '../branches/branch.entity';
import { Admin } from '../admins/admin.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Class } from '../classes/class.entity';

// =========================
// ENUMS
// =========================

export enum ParasiteType {
  WORM        = 'worm',
  LIVER_FLUKE = 'liver_fluke',
  MALARIA     = 'malaria',
  OTHER       = 'other',
}

export enum DrugForm {
  TABLET    = 'tablet',
  LIQUID    = 'liquid',
  INJECTION = 'injection',
  OTHER     = 'other',
}

export enum InjectionReaction {
  NONE     = 'none',
  MILD     = 'mild',
  MODERATE = 'moderate',
  SEVERE   = 'severe',
}

export enum InjectionStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  SKIPPED   = 'skipped',
  MISSED    = 'missed',
}

// =========================
// ENTITY
// =========================

@Entity('parasite_injections')
@Index('idx_parasite_student_id', ['studentId'])
@Index('idx_parasite_administered_date', ['administered_date'])
@Index('idx_parasite_round', ['studentId', 'parasite_type', 'round_number'])
export class ParasiteInjection {
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


  @Column('uuid', { name: 'class_id', nullable: true })
classId: string | null;

@ManyToOne(() => Class, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'class_id' })
class: Class | null;

  // =========================
  // FK: Branch (optional — where injection was given)
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
  academicYearId: string | null;

  @ManyToOne(() => AcademicYear, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear | null;

  // =========================
  // FK: Admin who administered (nurse / doctor / staff)
  // =========================
  @Column('uuid', { name: 'administered_by', nullable: true })
  administeredById: string | null;

  @ManyToOne(() => Admin, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'administered_by' })
  administeredBy: Admin | null;

  // =========================
  // PARASITE / DRUG
  // =========================

  @Column({
    type: 'enum',
    enum: ParasiteType,
    default: ParasiteType.WORM,
  })
  parasite_type: ParasiteType;

  @Column({ type: 'varchar', length: 255 })
  drug_name: string; // e.g. "Albendazole", "Mebendazole"

  @Column({ type: 'varchar', length: 100 })
  dosage: string; // e.g. "400mg", "200ml"

  @Column({
    type: 'enum',
    enum: DrugForm,
    default: DrugForm.TABLET,
    nullable: true,
  })
  drug_form: DrugForm | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  batch_number: string | null;

  @Column({ type: 'date', nullable: true })
  expiry_date: string | null;

  // =========================
  // SCHEDULING
  // =========================

  @Column({ type: 'date' })
  administered_date: string; // date the drug was given

  @Column({ type: 'int', default: 1 })
  round_number: number; // 1st dose, 2nd dose, 3rd dose...

  @Column({ type: 'date', nullable: true })
  next_due_date: string | null; // when next round should happen

  @Column({ type: 'varchar', length: 255, nullable: true })
  treatment_program: string | null; // e.g. "WHO Deworming Program 2025"

  // =========================
  // RESULT / FOLLOW-UP
  // =========================

  @Column({
    type: 'enum',
    enum: InjectionReaction,
    default: InjectionReaction.NONE,
    nullable: true,
  })
  reaction: InjectionReaction | null;

  @Column({ type: 'text', nullable: true })
  reaction_detail: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  weight_kg: number | null; // student weight at time of administration

  @Column({ type: 'text', nullable: true })
  note: string | null;

  // =========================
  // STATUS
  // =========================

  @Column({
    type: 'enum',
    enum: InjectionStatus,
    default: InjectionStatus.COMPLETED,
  })
  status: InjectionStatus;

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
}