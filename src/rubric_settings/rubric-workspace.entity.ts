import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rubric_workspaces')
export class RubricWorkspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_key', unique: true, default: 'default' })
  workspaceKey: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  objects: Record<string, unknown>[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
