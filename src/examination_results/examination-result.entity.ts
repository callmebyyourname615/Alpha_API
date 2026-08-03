import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../students/student.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { Admin } from '../admins/admin.entity';
import { Examination } from '../examination/examination.entity';

@Entity('examination_results')
export class ExaminationResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // =========================
  // FK: Examination
  // =========================
  @Column('uuid', { name: 'examination_id' })
  examinationId: string;

  @ManyToOne(() => Examination, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examination_id' })
  examination: Examination;

  // =========================
  // FK: Student
  // =========================
  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  // =========================
  // FK: Enrollment (verify student belongs to the class)
  // =========================
  @Column('uuid', { name: 'enrollment_id' })
  enrollmentId: string;

  @ManyToOne(() => Enrollment, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Enrollment;

  // =========================
  // FK: Admin (graded by)
  // =========================
  @Column('uuid', { name: 'graded_by' })
  gradedBy: string;

  @ManyToOne(() => Admin, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'graded_by' })
  admin: Admin;

  // =========================
  // SCORE FIELDS
  // =========================
  @Column({ type: 'numeric', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'boolean', name: 'is_passed', default: false })
  isPassed: boolean;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @Column({ type: 'timestamptz', name: 'graded_at', default: () => 'NOW()' })
  gradedAt: Date;

  @Column({ default: false, name: 'is_deleted' })
  isDeleted: boolean;

  // =========================
  // TIMESTAMPS
  // =========================
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}