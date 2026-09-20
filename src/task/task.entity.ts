// task.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { File } from '../file/files.entity';
import { Student } from '../students/student.entity';
import { TeacherHomework } from '../teacher-homework/teacher-homework.entity';
import { Class } from '../classes/class.entity';

export type TaskStatus =
  | 'draft'
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'overdue';

export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type AssignmentMode = 'individual' | 'class' | 'multiple';
export type TaskVisibility = 'students' | 'parents' | 'classes';
export type PracticeFrequencyUnit = 'week' | 'month';

export interface TaskReminders {
  day_before?: boolean;
  day_before_days?: number;
  day_before_time?: string;
  day_before_schedule?: {
    offset_days: number;
    date: string;
    time: string;
    datetime: string;
    round?: number;
    due_date?: string;
  }[];
  due_day?: boolean;
  due_day_time?: string;
  due_day_schedule?: {
    round: number;
    due_date: string;
    date: string;
    time: string;
    datetime: string;
  }[];
  overdue?: boolean;
  overdue_time?: string;
}

export interface TaskSettings {
  allow_late_submission?: boolean;
  allow_resubmission?: boolean;
  require_parent_confirmation?: boolean;
  attach_rubric?: boolean;
  enable_discussion?: boolean;
  submission_schedule?: {
    count: number;
    dates: string[];
  };
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'timestamptz' })
  deadline: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Index()
  @Column({ length: 32, default: 'draft' })
  status: TaskStatus;

  // -------- Wizard step 1: Task Information --------
  @Index()
  @Column({ length: 64, nullable: true })
  subject?: string;

  @Column({ length: 16, nullable: true })
  difficulty?: TaskDifficulty;

  @Column({ type: 'int', nullable: true })
  estimated_time_minutes?: number;

  @Column({ type: 'int', nullable: true })
  points?: number;

  @Column({ type: 'int', nullable: true })
  practice_frequency?: number;

  @Column({ length: 8, nullable: true })
  practice_frequency_unit?: PracticeFrequencyUnit;

  // -------- Wizard step 2: Assignment --------
  @Column({ length: 16, nullable: true })
  assignment_mode?: AssignmentMode;

  @Column({ type: 'jsonb', nullable: true })
  assignment_student_ids?: string[];

  @Column({ type: 'jsonb', nullable: true })
  assignment_class_ids?: string[];

  @Index()
  @Column({ type: 'uuid', nullable: true })
  class_id?: string;

  @ManyToOne(() => Class, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  class?: Class;

  // -------- Wizard step 3: Schedule & Settings --------
  @Column({ type: 'timestamptz', nullable: true })
  start_date?: Date;

  @Column({ length: 8, nullable: true })
  due_time?: string; // "17:00"

  @Column({ length: 16, nullable: true })
  visibility?: TaskVisibility;

  @Column({ type: 'jsonb', nullable: true })
  reminders?: TaskReminders;

  @Column({ type: 'jsonb', nullable: true })
  settings?: TaskSettings;

  // -------- Progress + audit --------
  @Column({ type: 'int', default: 0 })
  progress_pct: number;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  academic_year_id?: string;

  // polymorphic user
  @Column({ type: 'uuid', nullable: true })
  added_by_id?: string;

  @Column({ length: 50, nullable: true })
  added_by_type?: string; // admin | teacher | staff | parent | superadmin

  @ManyToOne(() => Student, (student) => student.tasks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'student_id' })
  student?: Student;

  @OneToMany(() => File, (file) => file.task)
  files: File[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => TeacherHomework, (teacherhomework) => teacherhomework.tasks, {
    nullable: true,
  })
  homework?: TeacherHomework;
}
