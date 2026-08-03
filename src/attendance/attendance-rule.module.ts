import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttendanceRuleController } from './attendance-rule.controller';
import { AttendanceRuleService } from './attendance-rule.service';
import { AttendanceRule } from './attendance_rules';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceRule])],
  controllers: [AttendanceRuleController],
  providers: [AttendanceRuleService],
  exports: [AttendanceRuleService],
})
export class AttendanceRuleModule {}