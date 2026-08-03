// ============================================================
// FILE: src/appointment/appointment.entity.ts
// ============================================================
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
import { Branch }                 from '../branches/branch.entity';
import { AcademicYear }           from '../academic_years/academic-year.entity';
import { AppointmentStatus, CreatorRole } from './appointment.enum';
import { AppointmentParticipant } from './dto/appointment-participant.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'auditor_id', type: 'varchar', nullable: true })
  created_by?: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    select: false,
    insert: false,
    update: false,
  })
  creator_role?: CreatorRole | null;

  @Column({ type: 'uuid', nullable: true })
  branch_id: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch;

  @Column({ type: 'uuid', nullable: true })
  academic_year_id: string;

  @ManyToOne(() => AcademicYear, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear?: AcademicYear;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  appointment_place: string;

  @Column({ type: 'date', nullable: true })
  date: Date;

  @Column({ type: 'time', nullable: true })
  from_time?: string;

  @Column({ type: 'time', nullable: true })
  to_time?: string;

  @Column({ type: 'date', nullable: true })
  rescheduled_date?: Date;

  @Column({ type: 'time', nullable: true })
  rescheduled_from_time?: string;

  @Column({ type: 'time', nullable: true })
  rescheduled_to_time?: string;

  @Column({ type: 'timestamp', nullable: true })
  rescheduled_at?: Date | null;

  // The schedule that was active immediately BEFORE the latest reschedule.
  // Populated by creatorReschedule() before it overwrites rescheduled_*.
  // For the first reschedule this equals the original date/from/to.
  @Column({ type: 'date', nullable: true })
  previous_rescheduled_date?: Date | null;

  @Column({ type: 'time', nullable: true })
  previous_rescheduled_from_time?: string | null;

  @Column({ type: 'time', nullable: true })
  previous_rescheduled_to_time?: string | null;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;

  // ✅ Fixed: correct import path, no circular dependency issue
  @OneToMany(() => AppointmentParticipant, (p) => p.appointment, { cascade: true })
  participants?: AppointmentParticipant[];
}
