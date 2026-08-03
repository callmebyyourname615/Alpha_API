import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { PermissionModuleService } from './permission-module.service';
import { CreatePermissionModuleDto } from './dto/create-permission-module.dto';
import { UpdatePermissionModuleDto } from './dto/update-permission-module.dto';

@Controller('permission-modules')
export class PermissionModuleController {
  constructor(private readonly service: PermissionModuleService) {}

  @Post()
  create(@Body() dto: CreatePermissionModuleDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
findOne(@Param('id') id: string) {   // ✅ ใช้ string ตัวเล็ก
  return this.service.findOne(id);
}

@Put(':id')
update(@Param('id') id: string, @Body() dto: UpdatePermissionModuleDto) {
  return this.service.update(id, dto);
}

@Delete(':id')
remove(@Param('id') id: string) {
  return this.service.remove(id);
}

}
