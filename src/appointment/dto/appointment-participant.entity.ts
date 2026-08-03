// ============================================================
// FILE: src/appointment-participant/appointment-participant.entity.ts
// ============================================================
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from '../appointment.entity';
import { ParticipantStatus, PersonType } from '../appointment.enum';
import { Branch } from '../../branches/branch.entity';
import { AcademicYear } from '../../academic_years/academic-year.entity';

@Entity('appointment_persons')
export class AppointmentParticipant {
  @PrimaryColumn({ type: 'varchar', length: 24 })
  id: string;

  @Column({ type: 'uuid', nullable: true })
  appointment_id?: string;

  @ManyToOne(() => Appointment, (a: any) => a.participants, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Appointment;

  @Column({ type: 'uuid', nullable: true })
  person_id?: string;

  @Column({ type: 'enum', enum: PersonType, nullable: true })
  person_type?: PersonType;

  // Keep this nullable and without a database default until legacy appointment
  // rows are backfilled. API flows provide their own status values.
  @Column({ type: 'varchar', length: 50, nullable: true })
  status?: ParticipantStatus;

  @Column({ name: 'notes', type: 'text', nullable: true })
  response_note?: string;

  @Column({ name: 'rescheduled_count', type: 'int', default: 0 })
  reschedule_count: number;

  @Column({ type: 'int', default: 0 })
  declined_count: number;

  @Column({ type: 'uuid', nullable: true })
  branch_id?: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch;

  @Column({ type: 'uuid', nullable: true })
  academic_year_id?: string;

  @ManyToOne(() => AcademicYear, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear?: AcademicYear;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  responded_at?: Date | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  response_history?: any[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
