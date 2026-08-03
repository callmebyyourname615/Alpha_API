import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TeacherHomework } from './teacher-homework.entity';
import { Class } from '../classes/class.entity'; // ✅ new

@Entity('teacher_homework_item')
export class TeacherHomeworkItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'teacher_homework_id' })
  teacherHomeworkId: string;

  @ManyToOne(() => TeacherHomework, (teacherHomework) => teacherHomework.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teacher_homework_id' })
  teacherHomework: TeacherHomework;

  // =========================
  // FK: Class ✅ new
  // =========================
  @Column('uuid', { name: 'class_id', nullable: true })
  classId: string | null;

  @ManyToOne(() => Class, (cls) => cls.teacherHomeworkItems, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'class_id' })
  class: Class | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({
    type: 'varchar',
    name: 'teacher_guide_page',
    length: 50,
    nullable: true,
  })
  teacherGuidePage: string | null;

  @Column({ type: 'text', name: 'item_instruction', nullable: true })
  itemInstruction: string | null;

  @Column({ type: 'text', name: 'image_url', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'int', name: 'sort_order', default: 1 })
  sortOrder: number;

  @Column({ type: 'int', nullable: false })
  score: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}