import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rubric_evaluation_final_scores')
@Index(
  'UQ_rubric_eval_final_scope',
  ['classId', 'studentId', 'subjectKey', 'reportForm', 'reportMonth', 'reportYear', 'lessonFrom', 'lessonTo'],
  { unique: true },
)
export class RubricEvaluationFinalScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'class_id', type: 'varchar', default: '' })
  classId: string;

  @Column({ name: 'class_name', type: 'varchar', default: '' })
  className: string;

  @Column({ name: 'student_id', type: 'varchar' })
  studentId: string;

  @Column({ name: 'student_name', type: 'varchar', default: '' })
  studentName: string;

  @Column({ name: 'subject_id', type: 'varchar', default: '' })
  subjectId: string;

  @Column({ name: 'subject_key', type: 'varchar' })
  subjectKey: string;

  @Column({ name: 'subject_name', type: 'varchar', default: '' })
  subjectName: string;

  @Column({ name: 'report_form', type: 'varchar' })
  reportForm: string;

  @Column({ name: 'report_template', type: 'varchar', default: '' })
  reportTemplate: string;

  @Column({ name: 'grade_level', type: 'int', nullable: true })
  gradeLevel?: number | null;

  @Column({ name: 'report_month', type: 'int' })
  reportMonth: number;

  @Column({ name: 'report_year', type: 'varchar', default: '' })
  reportYear: string;

  @Column({ name: 'lesson_from', type: 'int', default: 0 })
  lessonFrom: number;

  @Column({ name: 'lesson_to', type: 'int', default: 0 })
  lessonTo: number;

  @Column({ name: 'total_score', type: 'float', nullable: true })
  totalScore?: number | null;

  @Column({ name: 'average_score', type: 'float', nullable: true })
  averageScore?: number | null;

  @Column({ name: 'final_score', type: 'float', nullable: true })
  finalScore?: number | null;

  @Column({ name: 'total_cell', type: 'varchar', default: '' })
  totalCell: string;

  @Column({ name: 'average_cell', type: 'varchar', default: '' })
  averageCell: string;

  @Column({ name: 'final_cell', type: 'varchar', default: '' })
  finalCell: string;

  @Column({ name: 'score_cells', type: 'jsonb', nullable: true })
  scoreCells?: Record<string, unknown> | null;

  @Column({ type: 'varchar', default: '' })
  source: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
