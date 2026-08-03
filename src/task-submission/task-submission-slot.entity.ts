import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TaskSubmissionSlotStatus = 'pending' | 'submitted' | 'late' | 'missed' | 'reviewed';

@Entity('task_submission_slots')
@Index(['task_id', 'student_id', 'schedule_index'], { unique: true })
@Index(['task_id', 'status'])
export class TaskSubmissionSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  task_id: string;

  @Column({ type: 'uuid' })
  student_id: string;

  @Column({ type: 'int' })
  schedule_index: number;

  @Column({ type: 'timestamptz' })
  due_at: Date;

  @Column({ length: 16, default: 'pending' })
  status: TaskSubmissionSlotStatus;

  @Column({ type: 'timestamptz', nullable: true })
  submitted_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  submitted_by_id?: string;

  @Column({ length: 32, nullable: true })
  submitted_by_type?: string;

  @Column({ type: 'text', nullable: true })
  answer_text?: string;

  @Column({ type: 'jsonb', nullable: true })
  file_ids?: string[];

  @Column({ type: 'timestamptz', nullable: true })
  parent_confirmed_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  parent_confirmed_by_id?: string;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  reviewed_by_id?: string;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ type: 'int', nullable: true })
  progress_pct?: number;

  @Column({ type: 'int', nullable: true })
  score?: number;

  @Column({ type: 'int', nullable: true })
  max_score?: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
