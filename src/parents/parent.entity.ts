import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  ManyToOne,
  JoinTable,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../roles/role.entity';
import { Branch } from '../branches/branch.entity';

@Entity('parents')
export class Parent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'branch_id', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  // ────────────────────────────────────────────────
  // Authentication fields – should NOT be stored as plain text!
  // ────────────────────────────────────────────────
  @Column({ length: 255, nullable: true, unique: true })
  email: string;

  @Column({ length: 255, nullable: true, select: false }) // ← hide from queries by default
  passwordHash: string; // ← renamed + important: NEVER store plain password

  @Column({ length: 100, nullable: true, unique: true })
  username: string; // optional, but good to have unique if used for login

  // ────────────────────────────────────────────────
  // Personal information
  // ────────────────────────────────────────────────
  @Column({ length: 100, nullable: true })
  firstName_lao: string;

  @Column({ length: 100, nullable: true })
  firstName_eng: string;

  @Column({ length: 100, nullable: true })
  midleName_lao: string;
  @Column({ length: 100, nullable: true })
  midleName_eng: string;

  @Column({ length: 100, nullable: true })
  lastName_lao: string;

  @Column({ length: 100, nullable: true })
  lastName_eng: string;

  @Column({ length: 255, nullable: true })
  nickname: string; // optional field for nickname

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ length: 20 })
  gender: string; // consider enum: 'male' | 'female' | 'other' | 'prefer_not_to_say'

  @Column({ length: 100, nullable: true })
  nationality: string;

  @Column({ length: 100, nullable: true })
  ethnicity: string;

  @Column({ length: 100, nullable: true })
  religion: string;

  @Column({ length: 20, nullable: true })
  family_book_number: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  family_book_url: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  id_card_url: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  idCard_no: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  passport_number: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  passport_image_url: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  education_level: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  relation_type: string;

  // ────────────────────────────────────────────────
  // Contact & Address
  // ────────────────────────────────────────────────
  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 20, nullable: true })
  mobile_phone: string;

  @Column({ length: 255, nullable: true })
  village: string;

  @Column({ length: 255, nullable: true })
  district: string;

  @Column({ length: 255, nullable: true })
  province: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  home_number: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  home_unit: string;

  @Column({ type: 'text', nullable: true })
  home_address: string; // can store as JSON string if complex

  @Column({ length: 512, nullable: true })
  home_picture_url: string; // optional field for home picture

  @Column({ length: 255, nullable: true })
  work_province: string;

  @Column({ length: 255, nullable: true })
  work_district: string;

  @Column({ length: 255, nullable: true })
  work_village: string;

  // ────────────────────────────────────────────────
  // Occupation / Work
  // ────────────────────────────────────────────────
  @Column({ length: 255, nullable: true })
  occupation: string;

  @Column({ length: 255, nullable: true })
  company_name: string; // renamed for clarity

  // ────────────────────────────────────────────────
  // Documents / Media
  // ────────────────────────────────────────────────
  @Column({ length: 512, nullable: true })
  profilePictureUrl: string;

  @Column({ length: 512, nullable: true })
  idCardUrl: string; // or idCardFrontUrl + idCardBackUrl if needed

  // ────────────────────────────────────────────────
  // Roles (Many-to-Many)
  // ────────────────────────────────────────────────
  @ManyToMany(() => Role, (role) => role.parents, { cascade: false })
  @JoinTable({
    name: 'parent_roles',
    joinColumn: {
      name: 'parent_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles: Role[];

  // ────────────────────────────────────────────────
  // Status & Timestamps
  // ────────────────────────────────────────────────
  @Column({ default: true })
  isActive: boolean;

  @Column({ name: 'approval_status', length: 16, default: 'pending' })
  approvalStatus: 'pending' | 'approved' | 'rejected';

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt: Date | null;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason: string | null;

  @Column({ default: false })
  isDeleted: boolean; // ← for soft delete

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
