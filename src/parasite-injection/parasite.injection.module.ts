import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParasiteInjection } from './parasite.injection.entity';
import { Student } from '../students/student.entity';
import { Admin } from '../admins/admin.entity';
import { ParasiteInjectionService } from './parasite.injection.service';
import { ParasiteInjectionController } from './parasite.injection.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParasiteInjection, Student, Admin])],
  controllers: [ParasiteInjectionController],
  providers: [ParasiteInjectionService],
  exports: [ParasiteInjectionService],
})
export class ParasiteInjectionModule {}