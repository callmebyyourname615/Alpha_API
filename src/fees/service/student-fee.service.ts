import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StudentFee } from '../entities/student-fee.entity';
import { PaymentRecord } from '../entities/payment-record.entity';
import { FeeAssignmentService } from './fee-assignment.service';
import { AssignStudentFeeDto, StudentFeeQueryDto, UpdatePaymentPlanDto } from '../dto/student-fee.dto';
import { FeeStatus, PaymentPlan, PaymentRecordStatus } from '../entities/enums';
import { generateInstallments } from '../installment.helper';

@Injectable()
export class StudentFeeService {
  constructor(
    @InjectRepository(StudentFee)
    private readonly studentFeeRepo: Repository<StudentFee>,
    @InjectRepository(PaymentRecord)
    private readonly paymentRecordRepo: Repository<PaymentRecord>,
    private readonly feeAssignmentService: FeeAssignmentService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Assign a fee to one or more students and auto-generate installment records.
   * Wrapped in a transaction so either all students are assigned or none.
   */
  async assignToStudents(dto: AssignStudentFeeDto): Promise<StudentFee[]> {
    const assignment = await this.feeAssignmentService.findOne(dto.fee_assignment_id);
    const baseAmount = Number(assignment.fee_template.amount);
    const yearlyDiscount = Number(assignment.yearly_discount);

    const netAmount =
      dto.payment_plan === PaymentPlan.YEARLY
        ? baseAmount - yearlyDiscount
        : baseAmount;

    if (netAmount <= 0) {
      throw new BadRequestException('Net amount after discount must be greater than zero.');
    }

    const results: StudentFee[] = [];

    await this.dataSource.transaction(async (manager) => {
      for (const studentId of dto.student_ids) {
        // Skip if already assigned
        const existing = await manager.findOne(StudentFee, {
          where: {
            fee_assignment_id: dto.fee_assignment_id,
            student_id: studentId,
          },
        });
        if (existing) continue;

        // Create StudentFee record
        const studentFee = manager.create(StudentFee, {
          fee_assignment_id: dto.fee_assignment_id,
          student_id: studentId,
          payment_plan: dto.payment_plan,
          total_amount: baseAmount,
          discount_applied:
            dto.payment_plan === PaymentPlan.YEARLY ? yearlyDiscount : 0,
          paid_amount: 0,
          status: FeeStatus.PENDING,
        });
        const savedFee = await manager.save(StudentFee, studentFee);

        // Generate installment records
        const slots = generateInstallments(dto.payment_plan, netAmount);
        const records = slots.map((slot) =>
          manager.create(PaymentRecord, {
            student_fee_id: savedFee.id,
            amount: slot.amount,
            period_label: slot.period_label,
            due_date: slot.due_date,
            status: PaymentRecordStatus.PENDING,
          }),
        );
        await manager.save(PaymentRecord, records);

        results.push(savedFee);
      }
    });

    return results;
  }

  async findAll(query: StudentFeeQueryDto): Promise<StudentFee[]> {
    const qb = this.studentFeeRepo
      .createQueryBuilder('sf')
      .leftJoinAndSelect('sf.fee_assignment', 'fa')
      .leftJoinAndSelect('fa.fee_template', 'ft')
      .leftJoinAndSelect('sf.payment_records', 'pr')
      .orderBy('sf.created_at', 'DESC')
      .addOrderBy('pr.due_date', 'ASC');

    if (query.student_id)
      qb.andWhere('sf.student_id = :sid', { sid: query.student_id });
    if (query.fee_assignment_id)
      qb.andWhere('sf.fee_assignment_id = :faid', { faid: query.fee_assignment_id });
    if (query.payment_plan)
      qb.andWhere('sf.payment_plan = :pp', { pp: query.payment_plan });

    return qb.getMany();
  }

  async findOne(id: string): Promise<StudentFee> {
    const sf = await this.studentFeeRepo.findOne({
      where: { id },
      relations: ['fee_assignment', 'fee_assignment.fee_template', 'payment_records'],
      order: { payment_records: { due_date: 'ASC' } },
    });
    if (!sf) throw new NotFoundException(`Student fee ${id} not found`);
    return sf;
  }

  /**
   * Change a student's payment plan and regenerate all unpaid installments.
   */
  async updatePaymentPlan(
    id: string,
    dto: UpdatePaymentPlanDto,
  ): Promise<StudentFee> {
    const sf = await this.findOne(id);

    const hasPaidRecords = sf.payment_records.some(
      (r) => r.status === PaymentRecordStatus.PAID,
    );
    if (hasPaidRecords) {
      throw new ConflictException(
        'Cannot change payment plan once payments have been made.',
      );
    }

    const assignment = sf.fee_assignment;
    const baseAmount = Number(assignment.fee_template.amount);
    const yearlyDiscount = Number(assignment.yearly_discount);

    const netAmount =
      dto.payment_plan === PaymentPlan.YEARLY
        ? baseAmount - yearlyDiscount
        : baseAmount;

    await this.dataSource.transaction(async (manager) => {
      // Delete all existing pending records
      await manager.delete(PaymentRecord, { student_fee_id: id });

      // Update student fee
      sf.payment_plan = dto.payment_plan;
      sf.discount_applied =
        dto.payment_plan === PaymentPlan.YEARLY ? yearlyDiscount : 0;
      await manager.save(StudentFee, sf);

      // Generate new installments
      const slots = generateInstallments(dto.payment_plan, netAmount);
      const records = slots.map((slot) =>
        manager.create(PaymentRecord, {
          student_fee_id: id,
          amount: slot.amount,
          period_label: slot.period_label,
          due_date: slot.due_date,
          status: PaymentRecordStatus.PENDING,
        }),
      );
      await manager.save(PaymentRecord, records);
    });

    return this.findOne(id);
  }

  /**
   * Recalculate paid_amount and status on a StudentFee.
   * Called after a PaymentRecord is marked as paid.
   */
  async recalculateStatus(studentFeeId: string): Promise<void> {
    const sf = await this.findOne(studentFeeId);
    const netAmount = Number(sf.total_amount) - Number(sf.discount_applied);

    const paidAmount = sf.payment_records
      .filter((r) => r.status === PaymentRecordStatus.PAID)
      .reduce((sum, r) => sum + Number(r.amount), 0);

    let status: FeeStatus;
    if (paidAmount <= 0) {
      status = FeeStatus.PENDING;
    } else if (paidAmount >= netAmount) {
      status = FeeStatus.PAID;
    } else {
      status = FeeStatus.PARTIAL;
    }

    await this.studentFeeRepo.update(studentFeeId, {
      paid_amount: paidAmount,
      status,
    });
  }
}