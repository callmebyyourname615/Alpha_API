import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { Student } from '../students/student.entity';

// =========================
// ENUM
// =========================

export enum SiblingRelationType {
  FULL = 'full', // same two parents
  HALF = 'half', // shares one parent
  STEP = 'step', // no biological parent shared, linked via guardianship/marriage
  TWIN = 'twin', // same parents, same dob (subset of full, called out for convenience)
  ADOPTED = 'adopted',
  OTHER = 'other',
}

// =========================
// ENTITY
// =========================
// Stores a single directed-free pair (student_id, sibling_id) with
// student_id < sibling_id enforced at the service layer so each pair
// is only ever stored once, regardless of which student initiated it.

@Entity('student_siblings')
@Unique('uq_student_sibling_pair', ['studentId', 'siblingId'])
@Index('idx_sibling_student_id', ['studentId'])
@Index('idx_sibling_sibling_id', ['siblingId'])
export class Sibling {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // =========================
  // FK: Student (lower/primary side of the pair)
  // =========================
  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  // =========================
  // FK: Sibling (the other student in the pair)
  // =========================
  @Column('uuid', { name: 'sibling_id' })
  siblingId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sibling_id' })
  sibling: Student;

  // =========================
  // METADATA
  // =========================
  @Column({
    type: 'enum',
    enum: SiblingRelationType,
    default: SiblingRelationType.FULL,
  })
  relation_type: SiblingRelationType;

  // true if this link was created by the auto-detection job (shared parents),
  // false if a staff member created it manually.
  @Column({ default: false })
  auto_detected: boolean;

  // true if parents were auto-linked across the two students when this
  // sibling relationship was created
  @Column({ default: false })
  parents_linked: boolean;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  // =========================
  // TIMESTAMPS
  // =========================
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}