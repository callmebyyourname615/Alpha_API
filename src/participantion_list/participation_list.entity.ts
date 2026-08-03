import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Level } from '../levels/level.entity'; // ← adjust path to match your project

@Entity('participation_list')
export class ParticipationList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, length: 150 })
  name: string;

  @Column({ nullable: true, type: 'varchar', length: 50 })
  score: string;

  @ManyToMany(() => Level, {
    cascade: true,
    eager: false,
  })
  @JoinTable({
    name: 'participation_list_levels',
    joinColumn: {
      name: 'participation_list_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'level_id',
      referencedColumnName: 'id',
    },
  })
  levels: Level[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}