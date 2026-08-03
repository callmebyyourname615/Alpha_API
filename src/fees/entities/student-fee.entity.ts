import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../students/student.entity';
import { FeeAssignment } from './fee-assignment.entity';
import { FeeStatus, PaymentPlan } from './enums';
import { PaymentRecord } from './payment-record.entity';

@Entity('student_fees')
export class StudentFee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FeeAssignment, { eager: true })
  @JoinColumn({ name: 'fee_assignment_id' })
  fee_assignment: FeeAssignment;

  @Column({ name: 'fee_assignment_id' })
  fee_assignment_id: string;

  // FK to your existing Student entity
  @Column({ name: 'student_id' })
  student_id: string;

  // Uncomment when Student entity is imported:
   @ManyToOne(() => Student, { eager: true })
   @JoinColumn({ name: 'student_id' })
   student: Student;

  @Column({ type: 'enum', enum: PaymentPlan })
  payment_plan: PaymentPlan;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;       // original fee amount

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_applied: number;   // yearly discount applied if plan = yearly

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paid_amount: number;        // sum of paid PaymentRecords

  @Column({ type: 'enum', enum: FeeStatus, default: FeeStatus.PENDING })
  status: FeeStatus;

  @OneToMany(() => PaymentRecord, (pr) => pr.student_fee, { cascade: true })
  payment_records: PaymentRecord[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}