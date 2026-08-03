import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('task_submission_attempts')
@Index(['task_id', 'student_id', 'submission_number'], { unique: true })
export class TaskSubmissionAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  task_submission_id: string;

  @Column({ type: 'uuid' })
  task_id: string;

  @Column({ type: 'uuid' })
  student_id: string;

  @Column({ type: 'int' })
  submission_number: number;

  @Column({ type: 'uuid', nullable: true })
  file_id?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  submitted_at: Date;
}
