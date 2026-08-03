import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentLinkRequest } from './student-link-request.entity';
import { Student } from '../students/student.entity';
import { Parent } from '../parents/parent.entity';
import { StudentLinkRequestsService } from './student-link-request.service';
import { StudentLinkRequestsController } from './student-link-request.controller';
import { StudentModule } from '../students/student.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentLinkRequest, Student, Parent]),
    StudentModule,
  ],
  providers: [StudentLinkRequestsService],
  controllers: [StudentLinkRequestsController],
})
export class StudentLinkRequestModule {}
