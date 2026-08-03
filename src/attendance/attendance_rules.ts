import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Level } from '../levels/level.entity';

@Entity('attendance_rules')
export class AttendanceRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  levelId: string;

  @ManyToOne(() => Level, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'level_id' })
  level: Level;

  @Column()
  dayOfWeek: string; // monday, tuesday ...

  @Column({ type: 'time' })
  checkInStart: string;

  @Column({ type: 'time' })
  lateAfter: string;

  @Column({ type: 'time' })
  checkOutTime: string;

  // attendance_rules.ts — add these columns
  @Column({ type: 'time' })
  checkOutEnd: string; // latest allowed checkout time

  @Column({ type: 'time' })
  earlyBefore: string;
}
