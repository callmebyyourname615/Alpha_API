import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type GalleryVisibility = 'public' | 'private';
export type GalleryPostStatus = 'draft' | 'published';

@Entity('gallery_posts')
@Index(['status', 'published_at'])
@Index(['category'])
export class GalleryPost {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 180 }) title: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ length: 80, nullable: true }) category?: string;
  @Column({ length: 180, nullable: true }) location?: string;
  @Column({ type: 'date', nullable: true }) event_start_date?: string;
  @Column({ type: 'date', nullable: true }) event_end_date?: string;
  @Column({ length: 12, default: 'public' }) visibility: GalleryVisibility;
  @Column({ length: 12, default: 'draft' }) status: GalleryPostStatus;
  @Column({ default: false }) is_pinned: boolean;
  @Column({ type: 'uuid', nullable: true }) author_id?: string;
  @Column({ length: 32, nullable: true }) author_type?: string;
  @Column({ type: 'timestamptz', nullable: true }) published_at?: Date;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at: Date;
}
