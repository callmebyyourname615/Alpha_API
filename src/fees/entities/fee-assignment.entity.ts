import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { StudentFee } from './student-fee.entity';
import { FeeTemplate } from './fee-template.entity';
import { Class } from '../../classes/class.entity';
import { Admin } from '../../admins/admin.entity';

// import { Class } from '../class/class.entity';        // your existing entity
// import { User } from '../user/user.entity';           // your existing entity
// import { StudentFee } from '../student-fee/student-fee.entity';

@Entity('fee_assignments')
export class FeeAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FeeTemplate, { eager: true })
  @JoinColumn({ name: 'fee_template_id' })
  fee_template: FeeTemplate;

  @Column({ name: 'fee_template_id' })
  fee_template_id: string;

  // FK to your existing Class entity
  @Column({ name: 'class_id' })
  class_id: string;

  // Uncomment when Class entity is imported:
   @ManyToOne(() => Class, { eager: true })
   @JoinColumn({ name: 'class_id' })
   class: Class;

  @Column({ name: 'academic_year_id' })
  academic_year_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  yearly_discount: number;   // flat discount amount if parent pays full year

  @Column({ type: 'date', nullable: true })
  due_date: Date;

  // FK to teacher or admin who assigned
  @Column({ name: 'assigned_by' })
  assigned_by: string;

  // Uncomment when User entity is imported:
   @ManyToOne(() => Admin, { eager: true })  // assuming Admin is the entity for staff users
   @JoinColumn({ name: 'assigned_by' })
   assigner: Admin;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Uncomment when StudentFee entity is imported:
   @OneToMany(() => StudentFee, (sf) => sf.fee_assignment)
   student_fees: StudentFee[];
}