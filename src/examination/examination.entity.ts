import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Class } from '../classes/class.entity';
import { Branch } from '../branches/branch.entity';
import { Subject } from '../subjects/subject.entity';
import { Role } from '../roles/role.entity';
import { Admin } from '../admins/admin.entity';

@Entity('examinations')
export class Examination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // =========================
  // FK: Branch
  // =========================
  @Column('uuid', { name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  // =========================
  // FK: AcademicYear
  // =========================
  @Column('uuid', { name: 'academic_year_id' })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  // =========================
  // FK: Class
  // =========================
  @Column('uuid', { name: 'class_id' })
  classId: string;

  @ManyToOne(() => Class, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  // =========================
  // FK: Subject
  // =========================
  @Column('uuid', { name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Subject, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  // =========================
  // BASIC FIELDS
  // =========================
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamptz', name: 'exam_date' })
  examDate: Date;

  @Column({ type: 'int', name: 'duration_minutes' })
  durationMinutes: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    name: 'max_score',
    default: 100,
  })
  maxScore: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    name: 'pass_score',
    default: 50,
  })
  passScore: number;

  @Column({ default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'created_by_id' })
  createdById: string | null;

  @ManyToOne(() => Admin, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: Admin | null;

  // =========================
  // CHECKER / LOCK FIELDS
  // =========================
  @Column({ type: 'uuid', nullable: true, name: 'checker_id' })
  checkerId: string | null;

  @ManyToOne(() => Admin, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'checker_id' })
  checker: Admin | null;

  @Column({ type: 'uuid', nullable: true, name: 'super_admin_role_id' })
  superAdminRoleId: string | null;

  @ManyToOne(() => Role, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'super_admin_role_id' })
  superAdminRole: Role | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'checker_status', default: 'PENDING' })
  checkerStatus: 'PENDING' | 'CHECKED' | 'REJECTED' | null;

  @Column({ type: 'text', nullable: true, name: 'checker_reject_comment' })
  checkerRejectComment: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'super_admin_status', default: 'PENDING' })
  superAdminStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;

  @Column({ type: 'text', nullable: true, name: 'super_admin_reject_comment' })
  superAdminRejectComment: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'locked_until' })
  lockedUntil: Date | null;

  // =========================
  // FILE FIELDS
  // =========================
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'exam_file' })
  examFile: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'answer_file' })
  answerFile: string | null;

  // =========================
  // TIMESTAMPS
  // =========================
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
