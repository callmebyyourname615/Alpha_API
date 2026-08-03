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
    return this.repo.find({ relations: ['admins'] });
  }

  async findOne(id: string): Promise<Role | null> {
    return this.repo.findOne({ where: { id }, relations: ['admins'] });
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role | null> {
  // 1️⃣ Load the role with current admins
  const role = await this.repo.findOne({ where: { id }, relations: ['admins'] });
  if (!role) throw new NotFoundException('Role not found');

  // 2️⃣ Update role fields
  if (dto.name !== undefined) role.name = dto.name;
  if (dto.level !== undefined) role.level = Number(dto.level);

  // 4️⃣ Save the role (updates join table)
  await this.repo.save(role);

  // 5️⃣ Return updated role with admins
  return this.repo.findOne({ where: { id }, relations: ['admins'] });
}


  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
