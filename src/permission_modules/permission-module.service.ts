import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionModule } from './permission_module.entity';
import { CreatePermissionModuleDto } from './dto/create-permission-module.dto';
import { UpdatePermissionModuleDto } from './dto/update-permission-module.dto';

@Injectable()
export class PermissionModuleService {
  constructor(
    @InjectRepository(PermissionModule)
    private readonly permissionModuleRepo: Repository<PermissionModule>,
  ) {}

  async create(dto: CreatePermissionModuleDto) {
    const module = this.permissionModuleRepo.create(dto);
    return this.permissionModuleRepo.save(module);
  }

  async findAll() {
    return this.permissionModuleRepo.find();
  }

  async findOne(id: string) {
    const module = await this.permissionModuleRepo.findOne({ where: { id } });
    if (!module) throw new NotFoundException('Permission module not found');
    return module;
  }

  async update(id: string, dto: UpdatePermissionModuleDto) {
    const module = await this.findOne(id);
    Object.assign(module, dto);
    return this.permissionModuleRepo.save(module);
  }

  async remove(id: string) {
    const module = await this.findOne(id);
    return this.permissionModuleRepo.remove(module);
  }
}
