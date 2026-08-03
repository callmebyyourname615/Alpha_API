import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Subject } from '../subjects/subject.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Branch } from '../branches/branch.entity';
import { Admin } from '../admins/admin.entity';
import { TeacherHomework } from '../teacher-homework/teacher-homework.entity';

@Entity('teaching')
@Index(['adminId', 'subjectId', 'academicYearId'], { unique: true })
export class Teaching {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'admin_id' })
  adminId: string;

  @Column({ type: 'uuid', name: 'subject_id' })
  subjectId: string;

  @Column({ type: 'uuid', name: 'academic_year_id' })
  academicYearId: string;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId: string;

  // Relations (used for eager loading / type safety)
  @ManyToOne(() => Admin, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'admin_id' })
  teacher: Admin;

  @ManyToOne(() => Subject, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @ManyToOne(() => AcademicYear, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => TeacherHomework, (teacherhomework) => teacherhomework.teaching)
  homeworks: TeacherHomework[];
}
