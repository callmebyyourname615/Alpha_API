import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

interface ScoreEntry {
  studentId: string;
  studentName?: string;  // ← store name to avoid joins when reading history
  participationId: string;
  participationName: string;
  score: number;
}

@Entity('participation_scores')
export class ParticipationScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column({ type: 'uuid', nullable: true })
  academicYearId: string;

  @Column({ type: 'uuid', nullable: true })
  levelId: string;    // ← to know which participation lists were available

  @Column({ type: 'uuid', nullable: true })
  classId: string;    // ← to know which class was scored that day

  @Column({ type: 'jsonb', nullable: true })
  scores: ScoreEntry[];

  @Column({ type: 'uuid', nullable: true })
  addedBy: string;

  @Column({ type: 'date', nullable: true })
  date: Date | null;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;
}