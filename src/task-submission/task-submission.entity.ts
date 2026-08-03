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
import { Task } from '../task/task.entity';
import { Student } from '../students/student.entity';

export type TaskSubmissionStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'reviewed';

@Entity('task_submissions')
@Index(['task_id', 'student_id'], { unique: true })
export class TaskSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  task_id: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ length: 20, default: 'not_started' })
  status: TaskSubmissionStatus;

  @Column({ type: 'int', default: 0 })
  progress_pct: number;

  @Column({ type: 'text', nullable: true })
  answer_text?: string;

  @Column({ type: 'int', nullable: true })
  score?: number;

  @Column({ type: 'int', nullable: true })
  max_score?: number;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ type: 'uuid', nullable: true })
  reviewed_by_id?: string;

  @Column({ length: 50, nullable: true })
  reviewed_by_type?: string;

  @Column({ type: 'timestamptz', nullable: true })
  submitted_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
