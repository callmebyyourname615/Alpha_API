import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Examination } from './examination.entity';
import { ExaminationService } from './examination.service';
import { ExaminationController } from './examination.controller';
import { Subject } from '../subjects/subject.entity';
import { Admin } from '../admins/admin.entity';
import { Role } from '../roles/role.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Examination, Subject, Admin, Role]),
    NotificationsModule,
  ],
  controllers: [ExaminationController],
  providers: [ExaminationService],
  exports: [ExaminationService],
})
export class ExaminationModule {}
