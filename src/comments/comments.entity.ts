import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AuditorType {
  ADMIN = 'ADMIN',
  PARENT = 'PARENT',
}

export enum ModuleType {
  TASK = 'TASK',
  EVENT = 'EVENT',
  EVENT_ACTIVITY = 'EVENT_ACTIVITY',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'uuid', nullable: true })
  auditor_id: string; // admin_id หรือ parent_id

  @Column({ type: 'enum', enum: AuditorType, nullable: true })
  auditor_type: AuditorType | null;

  @Column({ type: 'uuid', nullable: true })
  module_id: string;

  // TASK rooms are scoped to one student. This prevents siblings who share
  // the same parent account from seeing each other's conversation.
  @Column({ type: 'uuid', nullable: true })
  student_id: string | null;

  @Column({ type: 'enum', enum: ModuleType, nullable: true })
  module_type: ModuleType;

  @Column({ type: 'uuid', nullable: true })
  reply_to_id: string | null;

  // Must be timestamptz — the API process runs in a UTC+7 timezone, and a
  // plain (timezone-naive) timestamp column gets silently misread as local
  // time on the way out, shifting created_at 7 hours into the past. That's
  // what was breaking every "unread since X" comparison against chat_reads
  // (which is correctly timestamptz): brand new comments looked older than
  // the admin's real read cursor and never counted as unread.
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
