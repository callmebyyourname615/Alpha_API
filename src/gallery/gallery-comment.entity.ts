import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('gallery_comments')
@Index(['gallery_id', 'created_at'])
export class GalleryComment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) gallery_id: string;
  @Column({ type: 'uuid' }) author_id: string;
  @Column({ length: 32 }) author_type: string;
  @Column({ type: 'text' }) body: string;
  @Column({ type: 'uuid', nullable: true }) reply_to_id?: string;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at: Date;
}
