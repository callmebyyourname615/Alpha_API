import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';

import { Class } from '../classes/class.entity';
import { Branch } from '../branches/branch.entity';
import { SubjectEvaluation } from '../subject_evaluations/subject-evaluation.entity';
import { Teaching } from '../teachings/teaching.entity';
import { TeachLearning } from '../teach_learning/teach-learning.entity';
import { Lesson } from '../lesson/lesson.entity';
import { SubjectType } from '../subject_types/subject-type.entity';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // =========================
  // FK: Class
  // =========================
  @Column({ type: 'uuid', nullable: true, name: 'class_id' })
  class_id: string | null;

  @ManyToOne(() => Class, (cls) => cls.subjects, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'class_id' })
  class: Class | null;

  @Column({ type: 'uuid', nullable: true, name: 'subject_type_id' })
  subjectTypeId: string | null;

  @ManyToOne(() => SubjectType, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'subject_type_id' })
  subjectType: SubjectType | null;

  // =========================
  // MANY-TO-MANY: Lesson
  // Subject links to many lessons after they are created
  // =========================
  @ManyToMany(() => Lesson, { cascade: true, eager: false })
  @JoinTable({
    name: 'subject_lessons',                                    // ✅ join table
    joinColumn:        { name: 'subject_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'lesson_id',  referencedColumnName: 'id' },
  })
  lessons: Lesson[];

  // =========================
  // STATUS
  // =========================
  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  // =========================
  // TIMESTAMPS
  // =========================
  @CreateDateColumn({ name: 'create_dt' })
  create_dt: Date;

  @UpdateDateColumn({ name: 'update_dt' })
  update_dt: Date;

  // =========================
  // RELATIONS
  // =========================
  @ManyToMany(() => Branch, (branch) => branch.subjects)
  branches: Branch[];

  @OneToMany(() => Teaching, (teaching) => teaching.subject)
  teachings: Teaching[];

  @OneToMany(() => TeachLearning, (teachLearning) => teachLearning.subject)
  teachLearnings: TeachLearning[];
}
