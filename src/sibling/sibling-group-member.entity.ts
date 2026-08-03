import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SiblingGroup } from './sibling-group.entity';
import { Student } from '../students/student.entity';
import { Admin } from '../admins/admin.entity';

// =========================
// ENTITY: SiblingGroupMember
// =========================
// Explicit join table between SiblingGroup and Student.
// Stored separately from the @ManyToMany convenience relation so
// we can attach per-member metadata (joined_at, added_by, etc.)

@Entity('sibling_group_members')
export class SiblingGroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── FK: Group ──────────────────────────────────────────────────────
  @Column('uuid', { name: 'group_id' })
  groupId: string;

  @ManyToOne(() => SiblingGroup, (g) => g.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: SiblingGroup;

  // ── FK: Student ────────────────────────────────────────────────────
  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  // ── Metadata ───────────────────────────────────────────────────────
  // Tracks who added this student to the group and when
  @Column('uuid', {
    name: 'added_by',
    nullable: true,
  })
  addedById: string | null;

  @ManyToOne(() => Admin, { nullable: true })
  @JoinColumn({ name: 'added_by' })
  addedBy: Admin;
  
  @CreateDateColumn({ type: 'timestamptz', name: 'joined_at' })
  joinedAt: Date;
}
