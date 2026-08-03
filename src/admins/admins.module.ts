import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { Admin } from './admin.entity';
import { Role } from '../roles/role.entity';
import { Branch } from '../branches/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, Role, Branch])],
  controllers: [AdminsController],
  providers: [AdminsService],
})
export class AdminsModule {}
