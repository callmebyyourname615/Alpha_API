import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PaymentRecord } from '../entities/payment-record.entity';
import { StudentFeeService } from './student-fee.service';
import { MarkAsPaidDto } from '../dto/payment-record.dto';
import { PaymentRecordStatus } from '../entities/enums';

@Injectable()
export class PaymentRecordService {
  constructor(
    @InjectRepository(PaymentRecord)
    private readonly paymentRecordRepo: Repository<PaymentRecord>,
    private readonly studentFeeService: StudentFeeService,
  ) {}

  async findByStudentFee(studentFeeId: string): Promise<PaymentRecord[]> {
    return this.paymentRecordRepo.find({
      where: { student_fee_id: studentFeeId },
      order: { due_date: 'ASC' },
    });
  }

  async markAsPaid(id: string, dto: MarkAsPaidDto): Promise<PaymentRecord> {
    const record = await this.paymentRecordRepo.findOne({
      where: { id },
      relations: ['student_fee'],
    });
    if (!record) throw new NotFoundException(`Payment record ${id} not found`);

    if (record.status === PaymentRecordStatus.PAID) {
      throw new ConflictException('This payment record is already marked as paid.');
    }

    record.status = PaymentRecordStatus.PAID;
    record.paid_date = dto.paid_date ? new Date(dto.paid_date) : new Date();
    record.reference = dto.reference || '';

    await this.paymentRecordRepo.save(record);

    // Recalculate the parent StudentFee's paid_amount and status
    await this.studentFeeService.recalculateStatus(record.student_fee_id);

    return record;
  }

  /**
   * Find all payment records past their due date that are still pending.
   * Can be run via a scheduled job (NestJS @Cron) to auto-mark overdue.
   */
  async findOverdue(): Promise<PaymentRecord[]> {
    return this.paymentRecordRepo.find({
      where: {
        status: PaymentRecordStatus.PENDING,
        due_date: LessThan(new Date()),
      },
      relations: ['student_fee'],
      order: { due_date: 'ASC' },
    });
  }

  /**
   * Mark all past-due pending records as OVERDUE.
   * Intended to be called from a scheduled cron job.
   */
  async markOverdueRecords(): Promise<number> {
    const overdue = await this.findOverdue();
    if (!overdue.length) return 0;

    await this.paymentRecordRepo.update(
      overdue.map((r) => r.id),
      { status: PaymentRecordStatus.OVERDUE },
    );

    // Recalculate statuses on affected student fees
    const uniqueFeeIds = [...new Set(overdue.map((r) => r.student_fee_id))];
    await Promise.all(
      uniqueFeeIds.map((fid) => this.studentFeeService.recalculateStatus(fid)),
    );

    return overdue.length;
  }
}