import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SiblingGroupMember } from './sibling-group-member.entity';
import { Student } from '../students/student.entity';

// =========================
// ENUM
// =========================

export enum SiblingRelationType {
  FULL     = 'full',
  HALF     = 'half',
  STEP     = 'step',
  TWIN     = 'twin',
  ADOPTED  = 'adopted',
  OTHER    = 'other',
}

// =========================
// ENTITY: SiblingGroup
// =========================
// One group represents a sibling family unit.
// e.g. group "Vongsa family" → members [student_a, student_b, student_c]
// Parents are automatically union-linked across all members when
// auto_link_parents = true.

@Entity('sibling_groups')
export class SiblingGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Optional human-readable label e.g. "Vongsa family"
  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({
    type: 'enum',
    enum: SiblingRelationType,
    default: SiblingRelationType.FULL,
  })
  relation_type: SiblingRelationType;

  // Whether parent links were synced across members when this group was saved
  @Column({ default: false })
  parents_linked: boolean;

  // Whether this group was detected automatically via shared-parent sweep
  @Column({ default: false })
  auto_detected: boolean;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  // =========================
  // RELATIONS
  // =========================

  // The join-table side: full member records with metadata
  @OneToMany(() => SiblingGroupMember, (m) => m.group, { cascade: true })
  members: SiblingGroupMember[];

  // Convenience: direct access to Student entities via many-to-many
  @ManyToMany(() => Student)
  @JoinTable({
    name: 'sibling_group_students',
    joinColumn:        { name: 'group_id',   referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'student_id', referencedColumnName: 'id' },
  })
  students: Student[];

  // =========================
  // TIMESTAMPS
  // =========================
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}