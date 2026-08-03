import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  Unique,
  CreateDateColumn,
} from 'typeorm';

@Entity('menu_reads')
@Unique('uniq_menu_read_scope', ['studentId', 'resource', 'resourceId'])
@Index('idx_menu_read_lookup', ['studentId', 'resource'])
export class MenuRead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @Column({ type: 'varchar', length: 32 })
  resource: string;

  @Column('uuid', { name: 'resource_id' })
  resourceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
