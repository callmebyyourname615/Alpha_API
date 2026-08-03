import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MarkAsPaidDto } from '../dto/payment-record.dto';
import { PaymentRecordService } from '../service/payment-record.service';

@Controller('payment-records')
export class PaymentRecordController {
  constructor(private readonly paymentRecordService: PaymentRecordService) {}

  // GET /payment-records/overdue
  // Admin: list all overdue installments across all students
  @Get('overdue')
  findOverdue() {
    return this.paymentRecordService.findOverdue();
  }

  // GET /payment-records/by-student-fee/:studentFeeId
  // List all installments for a specific student fee
  @Get('by-student-fee/:studentFeeId')
  findByStudentFee(@Param('studentFeeId', ParseUUIDPipe) studentFeeId: string) {
    return this.paymentRecordService.findByStudentFee(studentFeeId);
  }

  // PATCH /payment-records/:id/pay
  // Admin marks an installment as paid
  @Patch(':id/pay')
  markAsPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkAsPaidDto,
  ) {
    return this.paymentRecordService.markAsPaid(id, dto);
  }
}