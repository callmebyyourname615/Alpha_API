// role.entity.ts  – corrected
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Index,
  OneToMany,
} from 'typeorm';
import { Admin } from '../admins/admin.entity';
import { Parent } from '../parents/parent.entity';
import { Permission } from '../permission/permission.entity';

@Entity('roles')
@Index(['name'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  name: string;

  @Column({ type: 'integer', default: 0 })
  level: number;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // ────────────────────────────────────────────────
  // ManyToMany with Admins – inverse side
  // Owning side is in Admin (with @JoinTable)
  // ────────────────────────────────────────────────
  @ManyToMany(() => Admin, (admin) => admin.roles)
  admins: Admin[];

  // ────────────────────────────────────────────────
  // ManyToMany with Parents – inverse side
  // ────────────────────────────────────────────────
  @ManyToMany(() => Parent, (parent) => parent.roles, {
    cascade: false,
  })
  parents: Parent[];

  // ────────────────────────────────────────────────
  // OneToMany with Permissions
  // ────────────────────────────────────────────────
  @OneToMany(() => Permission, (permission) => permission.role, {
    cascade: true,
  })
  permissions: Permission[];
}