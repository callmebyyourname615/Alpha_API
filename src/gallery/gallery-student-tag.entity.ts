import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gallery_student_tags')
@Index(['gallery_id', 'student_id'], { unique: true })
export class GalleryStudentTag {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) gallery_id: string;
  @Column({ type: 'uuid' }) student_id: string;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
}
