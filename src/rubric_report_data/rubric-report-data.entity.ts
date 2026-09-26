import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rubric_report_data')
@Index('UQ_rubric_report_data_scope', ['kind', 'scopeKey'], { unique: true })
@Index('IDX_rubric_report_data_lookup', ['kind', 'classId', 'reportYear', 'reportMonth'])
export class RubricReportData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  kind: string;

  @Column({ name: 'scope_key', type: 'varchar', length: 255 })
  scopeKey: string;

  @Column({ name: 'class_id', type: 'varchar', default: '' })
  classId: string;

  @Column({ name: 'student_id', type: 'varchar', default: '' })
  studentId: string;

  @Column({ name: 'report_month', type: 'int', nullable: true })
  reportMonth?: number | null;

  @Column({ name: 'report_year', type: 'varchar', default: '' })
  reportYear: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
