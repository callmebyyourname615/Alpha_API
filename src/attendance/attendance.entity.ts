import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Student } from '../students/student.entity';
import { Admin } from '../admins/admin.entity';

export enum AttendanceType {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
}

export enum ScanMethod {
  QR = 'QR',
  MANUAL = 'MANUAL',
}

@Entity('attendances')
@Unique('UQ_ATTENDANCE_STUDENT_DATE', ['student_id', 'attendance_date'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, (student) => student.attendances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Admin, (admin) => admin.marked_attendances, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'marked_by_admin_id' })
  marked_by_admin?: Admin | null;

  @Column({ type: 'uuid', nullable: true })
  marked_by_admin_id?: string | null;

  @Column({ type: 'date', nullable: true })
  attendance_date: string;

  @Column({
    type: 'enum',
    enum: AttendanceType,
    default: AttendanceType.PRESENT,
  })
  type: AttendanceType;

  @Column({
    type: 'enum',
    enum: ScanMethod,
    default: ScanMethod.QR,
  })
  scan_method: ScanMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  remark?: string; // check-in status: EARLY | ON_TIME | LATE | AUTO ABSENT

  @Column({ type: 'varchar', length: 255, nullable: true })
  check_out_remark?: string; // checkout status: EARLY_CHECKOUT | ON_TIME | LATE_CHECKOUT

  @Column({ type: 'time', nullable: true })
  check_in?: string;

  @Column({ type: 'time', nullable: true })
  check_out?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}