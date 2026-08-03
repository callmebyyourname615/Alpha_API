import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRecord } from '../entities/payment-record.entity';
import { PaymentRecordService } from '../service/payment-record.service';
import { StudentFeeModule } from './student-fee.module';
import { PaymentRecordController } from '../controller/payment-record.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentRecord]),
    StudentFeeModule,
  ],
  controllers: [PaymentRecordController],
  providers: [PaymentRecordService],
  exports: [PaymentRecordService],
})
export class PaymentRecordModule {}