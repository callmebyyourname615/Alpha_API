import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gallery_photos')
@Index(['gallery_id', 'sort_order'])
export class GalleryPhoto {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) gallery_id: string;
  @Column({ type: 'uuid', nullable: true }) file_id?: string;
  @Column({ type: 'varchar', length: 512 }) file_path: string;
  @Column({ type: 'int', default: 0 }) sort_order: number;
  @Column({ type: 'text', nullable: true }) caption?: string;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
}
