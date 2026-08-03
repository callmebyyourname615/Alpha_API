// src/save_withdraw_reason/save-withdraw-reason.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaveWithdrawReason } from './save-withdraw-reason.entity';
import { SaveWithdrawReasonService } from './save-withdraw-reason.service';
import { SaveWithdrawReasonController } from './save-withdraw-reason.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SaveWithdrawReason])],
  controllers: [SaveWithdrawReasonController],
  providers: [SaveWithdrawReasonService],
  exports: [SaveWithdrawReasonService],
})
export class SaveWithdrawReasonModule {}