// src/savings/savings.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Check,
  OneToMany,
} from 'typeorm';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Admin } from '../admins/admin.entity';
import { PayReceive } from '../pay_receivce/pay-receive.entity';
import { SaveWithdrawReason } from '../save_resson/save-withdraw-reason.entity';
import { SavingSession } from './saving-session.entity';
import { SavingOwnerType, SavingTransactionType } from './saving-enums'; // ✅ from shared file

export { SavingOwnerType, SavingTransactionType }; // ✅ re-export so other files still work

@Entity('savings')
@Check(`
  ("owner_type" = 'STUDENT' AND "student_id" IS NOT NULL)
  OR
  ("owner_type" = 'CLASS' AND "class_id" IS NOT NULL)
`)
export class Saving {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SavingOwnerType,
    default: SavingOwnerType.STUDENT,
  })
  owner_type: SavingOwnerType;

  @ManyToOne(() => Student, (student) => student.savings, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student?: Student | null;

  @Column({ type: 'uuid', nullable: true })
  student_id?: string | null;

  @ManyToOne(() => Class, (cls) => cls.savings, { nullable: true })
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

  @ManyToOne(() => Admin, { nullable: false, eager: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: Admin;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  created_by: string;

  @ManyToOne(() => SavingSession, (s) => s.savings, { nullable: true })
  @JoinColumn({ name: 'session_id' })
  session?: SavingSession | null;

  @Column({ type: 'uuid', nullable: true })
  session_id?: string | null;

  @Column({
    type: 'enum',
    enum: SavingTransactionType,
  })
  transaction_type: SavingTransactionType;
  
  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  opening_balance: number;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  closing_balance: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note?: string;

  @OneToMany(() => PayReceive, (pr) => pr.saving)
  payReceives?: PayReceive[];

  @ManyToOne(() => SaveWithdrawReason, { nullable: true, eager: false })
  @JoinColumn({ name: 'withdraw_reason_id' })
  withdrawReason?: SaveWithdrawReason | null;

  @Column({ type: 'uuid', nullable: true })
  withdraw_reason_id?: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
