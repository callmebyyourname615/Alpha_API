import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Comment, AuditorType } from './comments.entity';

@Entity('comment_reactions')
@Index(['comment_id', 'auditor_id', 'auditor_type', 'emoji'], { unique: true })
export class CommentReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  comment_id: string;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column({ type: 'uuid' })
  auditor_id: string;

  @Column({ type: 'enum', enum: AuditorType })
  auditor_type: AuditorType;

  @Column({ length: 16 })
  emoji: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
