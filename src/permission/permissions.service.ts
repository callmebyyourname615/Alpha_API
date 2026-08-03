import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './permission.entity';
import { Role } from '../roles/role.entity';
import { PermissionModule } from '../permission_modules/permission_module.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,

@InjectRepository(Role)
  private roleRepository: Repository<Role>,          // ← index [1]

  @InjectRepository(PermissionModule)
  private moduleRepository: Repository<PermissionModule>,
  ) {}

  async create(dto: CreatePermissionDto): Promise<PermissionResponseDto> {
    const role = await this.roleRepository.findOneBy({ id: dto.role_id });

    if (!role) {
      throw new NotFoundException(`Role with ID ${dto.role_id} not found`);
    }

    let permissionModule: PermissionModule | null = null;

    if (dto.moduleId) {
      permissionModule = await this.moduleRepository.findOneBy({ id: dto.moduleId });
      if (!permissionModule) {
        throw new NotFoundException(`Module with ID ${dto.moduleId} not found`);
      }
    }

    const permission = this.permissionRepository.create({
      role,
      permissionModule,
      can_add: dto.can_add ?? false,
      can_view: dto.can_view ?? false,
      can_edit: dto.can_edit ?? false,
      can_update_password: dto.can_update_password ?? false,
      can_delete: dto.can_delete ?? false,
      can_export: dto.can_export ?? false,
    });

    const saved = await this.permissionRepository.save(permission);

    return this.toResponseDto(saved);
  }

async findAll(): Promise<PermissionResponseDto[]> {
  try {
    const permissions = await this.permissionRepository.find({
      relations: ['role', 'permissionModule'],
      order: { createdAt: 'DESC' },
    });

    console.log(`Found ${permissions.length} permissions`); // debug

    return permissions.map((p) => this.toResponseDto(p));
  } catch (error) {
    console.error('Error in findAll:', error);
    console.error('Stack:', error.stack);
    throw error; // rethrow so Nest logs full error
  }
}
  async findOne(id: string): Promise<PermissionResponseDto> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['role', 'permissionModule'],
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return this.toResponseDto(permission);
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<PermissionResponseDto> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['role', 'permissionModule'],
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Update role if provided
    if (dto.role_id) {
      const role = await this.roleRepository.findOneBy({ id: dto.role_id });
      if (!role) {
        throw new NotFoundException(`Role with ID ${dto.role_id} not found`);
      }
      permission.role = role;
    }

    // Update module (allow unsetting)
    if (dto.moduleId !== undefined) {
      if (dto.moduleId === null) {
        permission.permissionModule = null;
      } else {
        const module = await this.moduleRepository.findOneBy({ id: dto.moduleId });
        if (!module) {
          throw new NotFoundException(`Module with ID ${dto.moduleId} not found`);
        }
        permission.permissionModule = module;
      }
    }

    // Update flags only if explicitly provided
    if (dto.can_add !== undefined) permission.can_add = dto.can_add;
    if (dto.can_view !== undefined) permission.can_view = dto.can_view;
    if (dto.can_edit !== undefined) permission.can_edit = dto.can_edit;
    if (dto.can_update_password !== undefined) {
      permission.can_update_password = dto.can_update_password;
    }
    if (dto.can_delete !== undefined) permission.can_delete = dto.can_delete;
    if (dto.can_export !== undefined) permission.can_export = dto.can_export;

    const updated = await this.permissionRepository.save(permission);

    return this.toResponseDto(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.permissionRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return { message: 'Permission deleted successfully' };
  }

  // ─── Helper ────────────────────────────────────────────────────────────────

  private toResponseDto(permission: Permission): PermissionResponseDto {
  return {
    id: permission.id,
    roleId: permission.role?.id ?? null,          // ← safe access + fallback
    roleName: permission.role?.name ?? null,      // ← safe access + fallback
    moduleId: permission.permissionModule?.id ?? null,
    moduleName: permission.permissionModule?.name ?? null,
    canCreate: permission.can_add,
    canView: permission.can_view,
    canUpdate: permission.can_edit,
    canUpdatePassword: permission.can_update_password,
    canDelete: permission.can_delete,
    canExport: permission.can_export,
    createdAt: permission.createdAt.toISOString(),
    updatedAt: permission.updatedAt.toISOString(),
  };
}
}