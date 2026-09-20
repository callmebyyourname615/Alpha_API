import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { Admin } from '../admins/admin.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,

    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const role = this.repo.create(dto);
    return this.repo.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Role | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role | null> {
    const role = await this.repo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.level !== undefined) role.level = Number(dto.level);

    return this.repo.save(role);
  }


  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
