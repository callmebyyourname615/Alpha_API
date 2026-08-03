import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionModuleService } from './permission-module.service';
import { PermissionModuleController } from './permission-module.controller';
import { PermissionModule } from './permission_module.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionModule])],
  providers: [PermissionModuleService],
  controllers: [PermissionModuleController],
})
export class PermissionModuleModule {}
