import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Saving } from '../savings/savings.entity';
import { BankDepositBatch } from '../bankdepositbatch/bank-deposit-batch.entity';

export enum PayReceiveFlowType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
}

export enum PayReceiveStatus {
  // ── Shared ────────────────────────────────────────────────────────────────
  PENDING = 'pending',
  REJECTED = 'rejected', // admin rejected teacher_submitted → teacher may re-edit

  // ── Deposit chain ─────────────────────────────────────────────────────────
  // pending → teacher_submitted → admin_received → bank_deposited → super_admin_confirmed
  //                             ↑ (re-submit after REJECTED + can_edit)
  TEACHER_SUBMITTED = 'teacher_submitted',
  ADMIN_RECEIVED = 'admin_received',
  BANK_DEPOSITED = 'bank_deposited', // also set when added to a batch
  SUPER_ADMIN_CONFIRMED = 'super_admin_confirmed',

  // ── Withdrawal chain ──────────────────────────────────────────────────────
  // pending → admin_confirmed → super_admin_approved → parent_received
  //                           └─ super_admin_rejected (saving reversed)
  ADMIN_CONFIRMED = 'admin_confirmed',
  ADMIN_REJECTED = 'admin_rejected',
  SUPER_ADMIN_APPROVED = 'super_admin_approved',
  SUPER_ADMIN_REJECTED = 'super_admin_rejected',
  PARENT_RECEIVED = 'parent_received',
  TEACHER_RECEIVED = 'teacher_received',
}

@Entity('pay_receive')
export class PayReceive {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Saving relation ───────────────────────────────────────────────────────
  @ManyToOne(() => Saving, { nullable: false, eager: true })
  @JoinColumn({ name: 'saving_id' })
  saving: Saving;

  @Column({ type: 'uuid', name: 'saving_id' })
  saving_id: string;

  // ── Flow type ─────────────────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: PayReceiveFlowType,
    default: PayReceiveFlowType.DEPOSIT,
  })
  flow_type: PayReceiveFlowType;

  // ── Amount ────────────────────────────────────────────────────────────────
  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: number;

  // ── Status ────────────────────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: PayReceiveStatus,
    default: PayReceiveStatus.PENDING,
  })
  status: PayReceiveStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note?: string | null;

  // ── Edit gate: super admin must explicitly enable before rejected
  //    record can be edited/resubmitted by teacher or admin ──────────────────
  @Column({ default: false })
  can_edit: boolean;

  // ── Soft delete ───────────────────────────────────────────────────────────
  @Column({ default: false })
  is_deleted: boolean;

  // =========================================================================
  // DEPOSIT CHAIN COLUMNS
  // =========================================================================

  // Step 2a — Teacher submits cash
  @Column({ type: 'uuid', nullable: true })
  submitted_by?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  submitted_at?: Date | null;

  // Step 2b — Admin receives from teacher
  @Column({ type: 'uuid', nullable: true })
  received_by?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  received_at?: Date | null;

  // Step 3 — Admin confirms bank deposit
  @Column({ type: 'uuid', nullable: true })
  bank_deposited_by?: string | null;

  @Column({
    type: 'varchar',
    array: true,
    default: () => "'{}'",
    nullable: false,
  })
  bank_deposited_papers: string[];

  @Column({ type: 'timestamptz', nullable: true })
  bank_deposited_at?: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bank_reference?: string | null;

  @ManyToOne(() => BankDepositBatch, (batch) => batch.payReceives, {
    nullable: true,
  })
  @JoinColumn({ name: 'deposit_batch_id' })
  depositBatch: BankDepositBatch | null;

  @Column({ type: 'uuid', name: 'deposit_batch_id', nullable: true })
  depositBatchId: string | null;

  // Step 4 — Super admin final confirmation (deposit)
  @Column({ type: 'uuid', nullable: true })
  super_admin_confirmed_by?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  super_admin_confirmed_at?: Date | null;

  // =========================================================================
  // WITHDRAWAL CHAIN COLUMNS
  // =========================================================================

  @Column({ type: 'uuid', nullable: true })
  admin_confirmed_by?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  admin_confirmed_at?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  super_admin_approved_by?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  super_admin_approved_at?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  super_admin_rejected_by?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  super_admin_rejected_at?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  parent_received_by?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  parent_received_at?: Date | null;

  // ── Shared rejection fields ───────────────────────────────────────────────
  @Column({ type: 'uuid', nullable: true })
  rejected_by?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  rejected_at?: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejection_reason?: string | null;

  // ── Who initiated this record ─────────────────────────────────────────────
  @Column({ type: 'uuid', nullable: true })
  initiated_by?: string | null;

  // Step 4 (CLASS withdrawal) — Teacher/admin collects cash
  @Column({ type: 'uuid', nullable: true })
  teacher_received_by?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  teacher_received_at?: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}