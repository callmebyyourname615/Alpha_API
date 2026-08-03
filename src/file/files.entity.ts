import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Event } from '../event/events.entity';
import { EventActivity } from '../eventactivity/eventActivity.entity';
import { Task } from '../task/task.entity';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  module: string; // 'event', 'event_activity', 'task', 'comment', 'task_submission'

  @Column({ type: 'uuid', nullable: true })
  event_id?: string;

  @Column({ type: 'uuid', nullable: true })
  event_activity_id?: string;

  @Column({ type: 'uuid', nullable: true })
  task_id?: string;

  @Column({ type: 'uuid', nullable: true })
  comment_id?: string;

  @Column({ type: 'uuid', nullable: true })
  task_submission_id?: string;

  @Column({ type: 'uuid', nullable: true })
  gallery_id?: string;

  @Column({ length: 255 })
  file_path: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Event, (event) => event.files, { nullable: true })
  @JoinColumn({ name: 'event_id' })
  event?: Event;

  @ManyToOne(() => EventActivity, (activity) => activity.files, {
    nullable: true,
  })
  @JoinColumn({ name: 'event_activity_id' })
  eventActivity?: EventActivity;

  @ManyToOne(() => Task, (task) => task.files, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'task_id' })
  task?: Task;
}
