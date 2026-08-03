// src/savings/saving-session.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admin } from '../admins/admin.entity';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Class } from '../classes/class.entity';
import { SaveWithdrawReason } from '../save_resson/save-withdraw-reason.entity';
import { SavingTransactionType } from './saving-enums'; // ✅ from shared file, NOT from savings.entity
import { Saving } from './savings.entity';

@Entity('saving_sessions')
export class SavingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Admin, { nullable: false, eager: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: Admin;

  @Column({ type: 'uuid', name: 'created_by' })
  created_by: string;

  @ManyToOne(() => Class, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  class?: Class | null;

  @Column({ type: 'uuid', nullable: true })
  class_id?: string | null;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch | null;

  @Column({ type: 'uuid', nullable: true })
  branch_id?: string | null;

  @ManyToOne(() => AcademicYear, { nullable: true })
  @JoinColumn({ name: 'academic_year_id' })
  academic_year?: AcademicYear | null;

  @Column({ type: 'uuid', nullable: true })
  academic_year_id?: string | null;

  @ManyToOne(() => SaveWithdrawReason, { nullable: true })
  @JoinColumn({ name: 'withdraw_reason_id' })
  withdrawReason?: SaveWithdrawReason | null;

  @Column({ type: 'uuid', nullable: true })
  withdraw_reason_id?: string | null;

  @Column({
    type: 'enum',
    enum: SavingTransactionType,
    enumName: 'saving_session_transaction_type_enum', // ✅ unique name
  })
  transaction_type: SavingTransactionType;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: 'int', default: 0 })
  total_students: number;

  @Column({ type: 'int', default: 0 })
  success_count: number;

  @Column({ type: 'int', default: 0 })
  failed_count: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note?: string | null;

  @OneToMany(() => Saving, (saving) => saving.session)
  savings?: Saving[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}