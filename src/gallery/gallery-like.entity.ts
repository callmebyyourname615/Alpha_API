import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gallery_likes')
@Index(['gallery_id', 'actor_id', 'actor_type'], { unique: true })
export class GalleryLike {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) gallery_id: string;
  @Column({ type: 'uuid' }) actor_id: string;
  @Column({ length: 32 }) actor_type: string;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
}
