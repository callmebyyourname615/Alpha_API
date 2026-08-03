import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StudentFee } from './student-fee.entity';
import { PaymentRecordStatus } from './enums';

@Entity('payment_records')
export class PaymentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudentFee, (sf) => sf.payment_records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_fee_id' })
  student_fee: StudentFee;

  @Column({ name: 'student_fee_id' })
  student_fee_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 50 })
  period_label: string;       // e.g. "January 2025", "Q1 2025", "Full Year 2025"

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ type: 'date', nullable: true })
  paid_date: Date;

  @Column({
    type: 'enum',
    enum: PaymentRecordStatus,
    default: PaymentRecordStatus.PENDING,
  })
  status: PaymentRecordStatus;

  @Column({ nullable: true, length: 100 })
  reference: string;          // receipt or transaction reference

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}