import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parent } from '../parents/parent.entity';
import { Student } from '../students/student.entity';
import { SiblingGroupMember } from './sibling-group-member.entity';
import { SiblingGroup } from './sibling-group.entity';
import { SiblingGroupController } from './sibling.controller';
import { SiblingGroupService } from './sibling.service';

@Module({
  imports: [TypeOrmModule.forFeature([SiblingGroup, SiblingGroupMember, Student, Parent])],
  controllers: [SiblingGroupController],
  providers: [SiblingGroupService],
  exports: [SiblingGroupService],
})
export class SiblingGroupModule {}