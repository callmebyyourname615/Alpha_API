import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../roles/role.entity';
import { Branch } from '../branches/branch.entity';
import { Teaching } from '../teachings/teaching.entity';
import { Attendance } from '../attendance/attendance.entity';
import { TeachLearning } from '../teach_learning/teach-learning.entity';
import { ParasiteInjection } from '../parasite-injection/parasite.injection.entity';
import { Class } from '../classes/class.entity';

export interface HistoryWork {
  from_date: string;
  to_date: string;
  work_place: string;
  position: string;
  academy_year: string;
  teach_level: string;
  history_school: string;
  work_permit_image?: string | null;
}

export interface EducationLevel {
  edu_qualification: string;
  school_name: string;
  from_date: string;
  to_date: string;
  certificate_image?: string | null;
}

export interface EmergencyWith {
  first_name: string;
  last_name: string;
  job?: string | null;
  work_place?: string | null;
  doctor_contract?: string | null;
  social_security_no?: string | null;
  ss_image?: string | null;
  hospital?: string | null;
}

export interface BosInfo {
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  dob?: string | null;
  work_place?: string | null;
  phone?: string | null;
}

export interface FamilyInfo {
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  first_name_La?: string | null;
  last_name_La?: string | null;
  middle_name_La?: string | null;
  nick_name?: string | null;
  dob?: string | null;
  id_card_image?: string | null;
  nationality?: string | null;
  ethnicity?: string | null;
  religion?: string | null;
  education_level?: string | null;
  village?: string | null;
  district?: string | null;
  province?: string | null;
  home_no?: string | null;
  unit?: string | null;
  home_map?: string | null;
  family_book_no?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  job?: string | null;
  work_place?: string | null;
  email?: string | null;
  profile?: string | null;
}

export interface RestrictionItem {
  name: string;
  date?: string | null;
}

export interface OtherRestriction {
  medicine?: RestrictionItem[];
  food?: RestrictionItem[];
  other?: RestrictionItem[];
}

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  password: string | null;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string | null;

  @ManyToMany(() => Role, (role) => role.admins)
  @JoinTable({
    name: 'admin_roles',
    joinColumn: { name: 'admin_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  @Column({
    type: 'date',
    nullable: true,
    transformer: {
      from: (value: string | null) => (value ? new Date(value) : null),
      to: (value: Date | null) =>
        value ? value.toISOString().split('T')[0] : null,
    },
  })
  join_date: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true }) // ← added type + length
  first_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  middle_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name_La: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name_La: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  middle_name_La: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nick_name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true }) // length for phone
  phone: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true }) // length for phone
  tell: string | null;

  @Column({
    type: 'date',
    nullable: true,
    transformer: {
      from: (value: string | null) => (value ? new Date(value) : null),
      to: (value: Date | null) =>
        value ? value.toISOString().split('T')[0] : null,
    },
  })
  dob: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ethnicity: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  religion: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  id_card_number: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  id_card_image: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  passport_number: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passport_image: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  current_status: string | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  education_level: EducationLevel[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  history_work: HistoryWork[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  emergency_with: EmergencyWith[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  bos_info: BosInfo[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  family_info: FamilyInfo[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  other_restriction: OtherRestriction;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  village: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  province: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  birth_village: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  birth_district: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  birth_province: string | null;

  @Column({ type: 'text', nullable: true })
  home_address: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  home_picture_url: string | null; // ✅

  @Column({ type: 'varchar', length: 20, nullable: true })
  current_academic_year: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profile_pic: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Teaching, (teaching) => teaching.teacher)
  teachings: Teaching[];

  @OneToMany(() => Attendance, (attendance) => attendance.marked_by_admin)
  marked_attendances: Attendance[];

  @OneToMany(() => TeachLearning, (teachLearning) => teachLearning.admin)
  teachLearnings: TeachLearning[];

  @OneToMany(() => ParasiteInjection, (pi) => pi.administeredBy)
  parasiteInjections: ParasiteInjection[];

  @OneToMany(() => Class, (schoolClass) => schoolClass.homeroomTeacher)
  homeroomClasses: Class[];
}
