import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subject } from '../subjects/subject.entity';
import { Class } from '../classes/class.entity';
import { Student } from '../students/student.entity';
import { Admin } from '../admins/admin.entity';
import { SubjectEvaluation } from '../subject_evaluations/subject-evaluation.entity';

@Entity('evaluations')
export class Evaluation {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => Subject, { eager: true })
  @JoinColumn({ name: 'subject_id' })
  subject!: Subject;

  @ManyToOne(() => Admin, { eager: true })
  @JoinColumn({ name: 'admin_id' })
  admin!: Admin;

  @ManyToOne(() => Class, { eager: true })
  @JoinColumn({ name: 'class_id' })
  class!: Class;

  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  // เชื่อมกับหัวข้อประเมิน
  @ManyToOne(() => SubjectEvaluation, { eager: true, nullable: true })
  @JoinColumn({ name: 'subject_evaluation_id' })
  subjectEvaluation?: SubjectEvaluation;

  // แก้ปัญหา strictPropertyInitialization
  @Column({ type: 'float', nullable: true })
  score?: number;

  // Index into subjectEvaluation.contents[]. Each content-item (ประเมิน 1..N)
  // gets its own row so scores from different sub-evaluations don't collide.
  @Column({ name: 'content_index', type: 'smallint', default: 0 })
  contentIndex!: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at?: Date;
}
