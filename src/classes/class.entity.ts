import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { YearLevel } from '../year_levels/year-level.entity';
import { Saving } from '../savings/savings.entity';
import { Subject } from '../subjects/subject.entity';
import { TeacherHomeworkItem } from '../teacher-homework/teacher-homework-item.entity';
import { TeacherHomework } from '../teacher-homework/teacher-homework.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  year_level_id: string;

  @ManyToOne(() => YearLevel)
  @JoinColumn({ name: 'year_level_id' })
  yearLevel: YearLevel;

  @Column()
  name: string;

  @Column({ type: 'numeric', default: 0 })
  saving_wallet: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Saving, (saving) => saving.class)
  savings: Saving[];

  // ← removed participationLists relation (now lives on Level)

  @OneToMany(() => Subject, (subject) => subject.class)
  subjects: Subject[];

  @OneToMany(() => TeacherHomework, (hw) => hw.class)
  teacherHomeworks: TeacherHomework[];

  @OneToMany(() => TeacherHomeworkItem, (item) => item.class)
  teacherHomeworkItems: TeacherHomeworkItem[];
}