import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './permission.entity';
import { PermissionModule as PermissionModuleEntity } from '../permission_modules/permission_module.entity'; // better naming to avoid confusion
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    // Register only entities that belong to this module
    TypeOrmModule.forFeature([Permission, PermissionModuleEntity]),

    // Import the module that provides RoleRepository
    RolesModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}