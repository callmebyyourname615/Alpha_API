// src/timetables/timetable.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Class } from '../classes/class.entity';
import { Subject } from '../subjects/subject.entity';
import { Admin } from '../admins/admin.entity';

export enum DayOfWeek {
  MONDAY    = 'monday',
  TUESDAY   = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY  = 'thursday',
  FRIDAY    = 'friday',
  SATURDAY  = 'saturday',
  SUNDAY    = 'sunday',
}

@Entity('timetables')
export class Timetable {
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
  // FK: Teacher (Admin)
  // =========================
  @Column('uuid', { name: 'teacher_id' })
  teacherId: string;

  @ManyToOne(() => Admin, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Admin;

  // =========================
  // SCHEDULE FIELDS
  // =========================
  @Column({ type: 'enum', enum: DayOfWeek, name: 'day_of_week' })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'text', nullable: true, name: 'note' })
  note: string | null;

  // =========================
  // STATUS
  // =========================
  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

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
