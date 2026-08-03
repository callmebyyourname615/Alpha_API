import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Lesson } from '../lesson/lesson.entity';

@Entity('curriculums')
export class Curriculum {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @CreateDateColumn({ name: 'create_dt' })
  create_dt: Date;

  @ManyToMany(() => Lesson, (lesson) => lesson.curriculums)
  lessons: Lesson[];
}