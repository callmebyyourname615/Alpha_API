// save-withdraw-reason.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { SaveWithdrawReasonType } from './save-withdraw-reason-type.enum';

@Entity('save_withdraw_reasons')
export class SaveWithdrawReason {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nameLao: string;

  @Column({ type: 'varchar', length: 255 })
  nameEn: string;

  // ✅ new — which transaction type this reason applies to
  @Column({
    type: 'enum',
    enum: SaveWithdrawReasonType,
    default: SaveWithdrawReasonType.WITHDRAW,
  })
  type: SaveWithdrawReasonType;

  @Column({ default: true })
  status: boolean;

  @CreateDateColumn({ name: 'create_dt', type: 'timestamptz' })
  create_dt: Date;

  @UpdateDateColumn({ name: 'update_dt', type: 'timestamptz' })
  update_dt: Date;
}