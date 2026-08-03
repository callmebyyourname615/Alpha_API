import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Branch } from '../branches/branch.entity';
import { Saving } from '../savings/savings.entity';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentParticipant } from '../appointment/dto/appointment-participant.entity';
import { Teaching } from '../teachings/teaching.entity';

@Entity('academic_years')
export class AcademicYear {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  branch_id: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column()
  year_name: string;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Saving, (saving) => saving.academic_year)
  savings: Saving[];

  @OneToMany(() => Appointment, (a) => a.academicYear)
  appointments: Appointment[];

  @OneToMany(() => AppointmentParticipant, (ap) => ap.academicYear)
  appointmentPersons: AppointmentParticipant[];

  @OneToMany(() => Teaching, (teaching) => teaching.academicYear)
  teachings: Teaching[];
}
