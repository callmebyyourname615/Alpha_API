import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRecord } from '../entities/payment-record.entity';
import { StudentFee } from '../entities/student-fee.entity';
import { StudentFeeService } from '../service/student-fee.service';
import { FeeAssignmentModule } from './fee-assignment.module';
import { StudentFeeController } from '../controller/student-fee.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentFee, PaymentRecord]),
    FeeAssignmentModule,
  ],
  controllers: [StudentFeeController],
  providers: [StudentFeeService],
  exports: [StudentFeeService],
})
export class StudentFeeModule {}