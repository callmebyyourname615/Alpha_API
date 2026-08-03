import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PayReceive } from '../pay_receivce/pay-receive.entity';
import { Admin } from '../admins/admin.entity';

export enum BankDepositBatchStatus {
  PENDING = 'pending',
  SUPER_ADMIN_CONFIRMED = 'super_admin_confirmed',
  REJECTED = 'rejected',
}

@Entity('bank_deposit_batches')
export class BankDepositBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'deposited_by' })
  depositedBy: string;

  @ManyToOne(() => Admin, { nullable: false })
  @JoinColumn({ name: 'deposited_by' })
  depositor: Admin;

  @Column({
    type: 'varchar',
    array: true,
    default: () => "'{}'",
    nullable: false,
  })
  bankDepositedPapers: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  bankReference: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: BankDepositBatchStatus,
    default: BankDepositBatchStatus.PENDING,
  })
  status: BankDepositBatchStatus;

  @Column({ default: false })
  can_edit: boolean;

  // ── Snapshot of all PayReceive IDs that were ever in this batch ───────────
  // Stored as a simple uuid array so we can still find them after
  // depositBatchId is cleared on rejection (fixes the unlock bug).
  @Column({ type: 'uuid', array: true, default: () => "'{}'", nullable: false })
  payReceiveIds: string[];

  @Column('uuid', { name: 'super_admin_confirmed_by', nullable: true })
  superAdminConfirmedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  superAdminConfirmedAt: Date | null;

  @Column('uuid', { name: 'super_admin_rejected_by', nullable: true })
  superAdminRejectedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  superAdminRejectedAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'timestamptz', name: 'deposited_at', nullable: true })
  depositedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @OneToMany(() => PayReceive, (pr) => pr.depositBatch)
  payReceives: PayReceive[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
