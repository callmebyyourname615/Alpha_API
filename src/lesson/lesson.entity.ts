import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubjectType } from '../subject_types/subject-type.entity';
import { YearLevel } from '../year_levels/year-level.entity';
import { Curriculum } from '../curriculums/curriculum.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // =========================
  // FK: SubjectType
  // =========================
  @Column('uuid', { name: 'subject_type_id' })
  subjectTypeId: string;

  @ManyToOne(() => SubjectType, (subjectType) => subjectType.lessons, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'subject_type_id' })
  subjectType: SubjectType;

  // =========================
  // FK: YearLevel
  // =========================
  @Column('uuid', { name: 'year_level_id' })
  yearLevelId: string;

  @ManyToOne(() => YearLevel, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'year_level_id' })
  yearLevel: YearLevel;

  // =========================
  // MANY-TO-MANY: Curriculum
  // =========================
  @ManyToMany(() => Curriculum, (curriculum) => curriculum.lessons, {
    cascade: true,
    eager: false,
  })
  @JoinTable({
    name: 'lesson_curriculums',
    joinColumn:        { name: 'lesson_id',     referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'curriculum_id', referencedColumnName: 'id' },
  })
  curriculums: Curriculum[];

  // =========================
  // FILE FIELDS
  // =========================
  @Column({ type: 'varchar', length: 255, nullable: true, name: 's_file' })
  s_file: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 's_year' })
  s_year: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 't_file' })
  t_file: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 't_year' })
  t_year: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'e_file' })
  e_file: string | null;

  // =========================
  // TIMESTAMPS
  // =========================
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}