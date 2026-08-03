import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { Admin } from '../admins/admin.entity';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Admin]),
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [
    TypeOrmModule,                      // ← this exports ALL repositories from forFeature()
  ],
})
export class RolesModule {}