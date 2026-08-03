import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveReason } from './leave-reason.entity';
import { LeaveReasonService } from './leave-reason.service';
import { LeaveReasonController } from './leave-reason.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveReason])],
  controllers: [LeaveReasonController],
  providers: [LeaveReasonService],
  exports: [LeaveReasonService],
})
export class LeaveReasonModule {}