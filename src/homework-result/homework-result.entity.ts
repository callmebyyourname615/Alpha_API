import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TeacherHomework } from '../teacher-homework/teacher-homework.entity';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import { Branch } from '../branches/branch.entity';

@Entity('homework_results')
export class HomeworkResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // =========================
  // FK: TeacherHomework
  // =========================
  @Column('uuid', { name: 'homework_id' })
  homeworkId: string;

  @ManyToOne(() => TeacherHomework, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'homework_id' })
  homework: TeacherHomework;

  // =========================
  // FK: Student
  // =========================
  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  // =========================
  // FK: Class (room)
  // =========================
  @Column('uuid', { name: 'class_id', nullable: true })
  classId: string | null;

  @ManyToOne(() => Class, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  class: Class | null;

  // =========================
  // FK: Branch
  // =========================
  @Column('uuid', { name: 'branch_id', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  // =========================
  // SCORE FIELDS
  // =========================
  @Column({ type: 'numeric', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'jsonb', name: 'item_scores', nullable: true })
  itemScores: Array<{ homeworkItemId: string; score: number }> | null;

  @Column({ default: false, name: 'is_graded' })
  isGraded: boolean;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @Column({ type: 'text', name: 'submission_file', nullable: true })
  submissionFile: string | null;

  @Column({ type: 'timestamptz', name: 'submitted_at', default: () => 'NOW()' })
  submittedAt: Date;

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
