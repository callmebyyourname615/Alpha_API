import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Index } from 'typeorm';

export enum ChatReaderType {
  ADMIN = 'ADMIN',
  PARENT = 'PARENT',
}

@Entity('chat_reads')
@Index(['module_type', 'module_id', 'reader_id', 'reader_type', 'student_id'], { unique: true })
export class ChatRead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  module_type: string; // 'TASK', etc. — same convention as Comments/Files/Notifications

  @Column({ type: 'uuid' })
  module_id: string;

  @Column({ type: 'uuid' })
  reader_id: string;

  @Column({ type: 'enum', enum: ChatReaderType })
  reader_type: ChatReaderType;

  // TASK rooms are scoped to one student (see Comment entity), so an admin's
  // "read" cursor needs the same scoping — otherwise reading one parent's
  // thread would mark every other parent's thread on the same task as read
  // too. Null = legacy task-wide cursor (pre-dates per-student tracking).
  @Column({ type: 'uuid', nullable: true })
  student_id: string | null;

  @Column({ type: 'timestamptz' })
  last_read_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
