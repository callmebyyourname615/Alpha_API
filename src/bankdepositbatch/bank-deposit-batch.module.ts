// bank-deposit-batch.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankDepositBatch } from './bank-deposit-batch.entity';
import { PayReceive } from '../pay_receivce/pay-receive.entity';
import { BankDepositBatchService } from './bank-deposit-batch.service';
import { BankDepositBatchController } from './bank-deposit-batch.controller';
import { SavingsModule } from '../savings/saving.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankDepositBatch,
      PayReceive,
    ]),
    SavingsModule,
  ],
  controllers: [BankDepositBatchController],
  providers: [BankDepositBatchService],
  exports: [BankDepositBatchService],
})
export class BankDepositBatchModule {}