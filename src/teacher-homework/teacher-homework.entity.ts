import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TeacherHomeworkItem } from './teacher-homework-item.entity';
import { TeacherHomeworkStatus } from './teacher-homework-status.enum';
import { TeachLearning } from '../teach_learning/teach-learning.entity';
import { Branch } from '../branches/branch.entity';
import { Teaching } from '../teachings/teaching.entity';
import { Task } from '../task/task.entity';
import { Class } from '../classes/class.entity';

@Entity('teacher_homework')
export class TeacherHomework {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // =========================
  // FK: Teaching (MAIN RELATION)
  // =========================
  @Column('uuid', { name: 'teaching_id', nullable: true })
  teachingId: string;

  @ManyToOne(() => Teaching, (teaching) => teaching.homeworks, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'teaching_id' })
  teaching: Teaching;

  // =========================
  // FK: Branch
  // =========================
  @Column('uuid', { name: 'branch_id', nullable: true })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.teacherHomeworks, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  // =========================
  // FK: Class ✅ new
  // =========================
  @Column('uuid', { name: 'class_id', nullable: true })
  classId: string | null;

  @ManyToOne(() => Class, (cls) => cls.teacherHomeworks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'class_id' })
  class: Class | null;

  // =========================
  // OPTIONAL: TeachLearning
  // =========================
  @Column('uuid', { name: 'teach_learning_id', nullable: true })
  teachLearningId: string;

  @ManyToOne(() => TeachLearning, (tl) => tl.teacherHomeworks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'teach_learning_id' })
  teachLearning: TeachLearning;

  // =========================
  // BASIC FIELDS
  // =========================
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', name: 'overall_instruction', nullable: true })
  overallInstruction: string | null;

  @Column({ type: 'timestamptz', name: 'due_date', nullable: true })
  dueDate: Date | null;

  @Column({
    type: 'enum',
    enum: TeacherHomeworkStatus,
    default: TeacherHomeworkStatus.DRAFT,
  })
  status: TeacherHomeworkStatus;

  @Column({ type: 'timestamptz', name: 'sent_at', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'int', name: 'total_score', default: 0 })
  totalScore: number;

  // =========================
  // RELATIONS
  // =========================
  @OneToMany(() => TeacherHomeworkItem, (item) => item.teacherHomework, {
    cascade: true,
  })
  items: TeacherHomeworkItem[];

  @OneToMany(() => Task, (task) => task.homework)
  tasks: Task[];

  // =========================
  // TIMESTAMPS
  // =========================
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}