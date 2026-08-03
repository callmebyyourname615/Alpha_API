import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Admin } from '../admins/admin.entity';
import { Subject } from '../subjects/subject.entity';
import { TeacherHomework } from '../teacher-homework/teacher-homework.entity';

@Entity('teach_learning')
export class TeachLearning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'admin_id' })
  adminId: string;

  @Column('uuid', { name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Admin, (admin) => admin.teachLearnings, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @ManyToOne(() => Subject, (subject) => subject.teachLearnings, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ type: 'timestamp', name: 'start_date' })
  start_date: Date;

  @Column({ type: 'timestamp', name: 'end_date' })
  end_date: Date;

  @Column({ type: 'int', name: 'break_time', default: 0 })
  break_time: number;

  @Column({ type: 'int', name: 'teaching_time', default: 0 })
  teaching_time: number;

  @Column({ type: 'int', name: 'start_st_page' })
  start_st_page: number;

  @Column({ type: 'int', name: 'end_st_page' })
  end_st_page: number;

  @Column({ type: 'int', name: 'start_th_page' })
  start_th_page: number;

  @Column({ type: 'int', name: 'end_th_page' })
  end_th_page: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(
  () => TeacherHomework,
  (teacherHomework) => teacherHomework.teachLearning,
)
teacherHomeworks: TeacherHomework[];
}