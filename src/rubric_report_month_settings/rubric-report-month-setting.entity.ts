import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rubric_report_month_settings')
@Index('UQ_rubric_report_month_settings_scope_month', ['classId', 'studentId', 'subjectId', 'month'], { unique: true })
export class RubricReportMonthSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'class_id', type: 'varchar' })
  classId: string;

  @Column({ name: 'student_id', type: 'varchar', default: '' })
  studentId: string;

  @Column({ name: 'subject_id', type: 'varchar' })
  subjectId: string;

  @Column({ type: 'int' })
  month: number;

  @Column({ name: 'lesson_from', type: 'int' })
  lessonFrom: number;

  @Column({ name: 'lesson_to', type: 'int' })
  lessonTo: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
