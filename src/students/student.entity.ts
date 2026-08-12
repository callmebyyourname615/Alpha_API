import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Province } from '../location/province.entity';
import { District } from '../location/district.entity';
import { Parent } from '../parents/parent.entity';
import { Task } from '../task/task.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Branch } from '../branches/branch.entity';
import { Saving } from '../savings/savings.entity';
import { Enrollment } from '../enrollments/enrollment.entity';

// =========================
// INTERFACES
// =========================

export interface LiveWithItem {
  fullname: string;
  nickname: string;
  dob: string;
  id_card: string;
  id_card_image_url?: string | undefined;
  passport_no?: string | undefined;
  passport_image_url?: string | undefined;
  nationality?: string | undefined;
  ethnicity?: string | undefined;
  religion?: string | undefined;
  education_level?: string | undefined;
  current_village?: string | undefined;
  current_district?: string | undefined;
  current_province?: string | undefined;
  home_no?: string | undefined;
  home_unit?: string | undefined;
  home_map?: string | undefined;
  family_book_no?: string | undefined;
  family_book_url?: string | undefined;
  phone_number_one?: string | undefined;
  phone_number_two?: string | undefined;
  working_place?: string | undefined;
  email?: string | undefined;
  profile_image?: string | undefined;
  updated_at?: string | undefined;
}

export interface EmergencyContact {
  fullname: string;
  relationship_to_student?: string | undefined;
  job?: string | undefined;
  working_place?: string | undefined;
  phone1?: string | undefined;
  phone2?: string | undefined;
  hospital?: string | undefined;
  doc_name?: string | undefined;
  doc_contract?: string | undefined;
}

export interface BosInfo {
  fullname: string;
  nickname?: string | undefined;
  dob?: string | undefined;
  current_school?: string | undefined;
  phone1?: string | undefined;
  phone2?: string | undefined;
  current_village?: string | undefined;
  image_url?: string | undefined;
}

export interface SiblingsInfo {
  fullname: string;
  nickname?: string | undefined;
  dob?: string | undefined;
  current_school?: string | undefined;
  phone1?: string | undefined;
  phone2?: string | undefined;
  current_province?: string | undefined;
  current_district?: string | undefined;
  current_village?: string | undefined;
  image_url?: string | undefined;
}

export interface SchoolHistory {
  academic_year: string;
  year_level: string;
  school: string;
}

export interface StudentHealthInfo {
  birth_type: string;
  blood_type: string;
  congenital_diseases?: string[] | undefined;
  allergies?: string[] | undefined;
  teeth_condition?: string[] | undefined;
  medicine?: string[] | undefined;
}

export interface StudentPhysicaldisability {
  eye_condition?: string | undefined;
  ear_condition?: string | undefined;
  speak_condition?: string | undefined;
  other_condition?: string | undefined;
}

export interface StudentprotectiveInfo {
  Neck_condition?: string | undefined;
  Polio_condition?: string | undefined;
  Liver_condition?: string | undefined;
  Vitamin_deficiency?: string | undefined;
  Worm_condition?: string | undefined;
}

// =========================
// ENTITY
// =========================

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // =========================
  // FK: Branch
  // =========================
  @Column('uuid', { name: 'branch_id', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  // =========================
  // BASIC FIELDS
  // =========================
  @Column({ type: 'varchar', length: 100 })
  student_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profile_image_path: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_passport: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  first_name_lao: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  first_name_eng: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  midle_name_lao: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  midle_name_eng: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  last_name_lao: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  last_name_eng: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nickname: string;

  @Column({ type: 'date' })
  dob: Date;

  @Column({ type: 'varchar', length: 50 })
  gender: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dm_birth: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passport_number: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ethnicity: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  religion: string;

  // =========================
  // JSONB ARRAY COLUMNS
  // =========================
  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  live_with: LiveWithItem[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  emergency_contacts: EmergencyContact[];

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  saving_wallet: number;

  @Column({ default: true })
  is_active: boolean;

  // Approval workflow — mirrors the parent flow. Pending applications can be
  // approved (is_active=true + enrollment created) or rejected with a reason
  // that the parent sees in the app.
  @Column({ name: 'approval_status', length: 16, default: 'pending' })
  approvalStatus: 'pending' | 'approved' | 'rejected';

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt: Date | null;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason: string | null;

  @Column({ default: false })
  is_deleted: boolean;

  // =========================
  // LOCATION (current)
  // =========================
  @Column({ type: 'varchar', length: 255, nullable: true })
  village: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  parent_address: string;

  @Column({ type: 'text', nullable: true })
  home_map: string;

  @ManyToOne(() => Province, { nullable: true })
  province: Province | null;

  @ManyToOne(() => District, { nullable: true })
  district: District | null;

  // =========================
  // LOCATION (birth/registered)
  // =========================
  @Column({ type: 'varchar', length: 50, nullable: true })
  village_bd: string;

  @ManyToOne(() => Province, { nullable: true })
  province_db: Province | null;

  @ManyToOne(() => District, { nullable: true })
  district_db: District | null;

  // =========================
  // BOS
  // =========================
  @Column({ type: 'varchar', length: 100, nullable: true })
  bos_number: string;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  bos_info: BosInfo[];

  // =========================
  // SIBLINGS
  // =========================
  @Column({ name: 'sibling_number', type: 'varchar', length: 10, nullable: true })
  Siblings_number: string;

  @Column({ name: 'sibling_info', type: 'jsonb', nullable: true, default: () => "'[]'" })
  Siblings_info: SiblingsInfo[];

  // =========================
  // SCHOOL HISTORY
  // =========================

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  his_school_nursery: SchoolHistory[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  his_school_kindergarten: SchoolHistory[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  his_school_primary: SchoolHistory[];

  // =========================
  // HEALTH / DISABILITY / PROTECTIVE (history arrays)
  // =========================

  // history of health info of the student
  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  health_history: StudentHealthInfo[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  physical_disability: StudentPhysicaldisability[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  protective_info: StudentprotectiveInfo[];

  // =========================
  // RELATIONS
  // =========================
  @ManyToMany(() => Parent, { cascade: true })
  @JoinTable({
    name: 'student_parents',
    joinColumn: { name: 'student_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'parent_id', referencedColumnName: 'id' },
  })
  parents: Parent[];

  @OneToMany(() => Enrollment, (e) => e.student)
  enrollments: Enrollment[];

  @OneToMany(() => Saving, (saving) => saving.student)
  savings: Saving[];

  @OneToMany(() => Task, (task) => task.student)
  tasks: Task[];

  @OneToMany(() => Attendance, (attendance) => attendance.student)
  attendances: Attendance[];

  // =========================
  // TIMESTAMPS
  // =========================
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

