import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PermissionModule } from '../permission_modules/permission_module.entity';
import { Role } from '../roles/role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Role, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;                       // ← must exist for relation

  @ManyToOne(() => PermissionModule, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'permission_module_id' })
  permissionModule: PermissionModule | null;

  @Column({ default: false })
  can_add: boolean;                 // ← must match exactly what you use

  @Column({ default: false })
  can_view: boolean;

  @Column({ default: false })
  can_edit: boolean;

  @Column({ default: false })
  can_update_password: boolean;

  @Column({ default: false })
  can_delete: boolean;

  @Column({ default: false })
  can_export: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}