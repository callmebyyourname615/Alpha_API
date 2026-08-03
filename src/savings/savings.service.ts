import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, In } from 'typeorm';
import { CreateSavingDto } from './dto/create-saving.dto';
import { CreateBulkSavingDto } from './dto/create-bulk-saving.dto';
import { CreateClassSavingDto } from './dto/create-class-saving.dto';
import { CreateStudentsSavingSessionDto } from './dto/create-students-saving-session.dto';
import { UpdateSavingDto } from './dto/update-saving.dto';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import {
  Saving,
  SavingOwnerType,
  SavingTransactionType,
} from './savings.entity';
import {
  PayReceive,
  PayReceiveFlowType,
  PayReceiveStatus,
} from '../pay_receivce/pay-receive.entity';
import { CreateBulkSavingByClassDto } from './dto/create-bulk-saving-by-class.dto';
import { SavingSession } from './saving-session.entity';
import { PayReceiveService } from '../pay_receivce/pay-receive.service';

@Injectable()
export class SavingsService {
  constructor(
    @InjectRepository(Saving)
    private readonly savingRepository: Repository<Saving>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,

    @InjectRepository(PayReceive)
    private readonly payReceiveRepository: Repository<PayReceive>,

    @InjectRepository(SavingSession)
    private readonly savingSessionRepository: Repository<SavingSession>,

    @Inject(forwardRef(() => PayReceiveService))
    private readonly payReceiveService: PayReceiveService,
  ) {}

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private applyTransaction(
    balance: number,
    transactionType: SavingTransactionType,
    amount: number,
  ): number {
    if (transactionType === SavingTransactionType.DEPOSIT)
      return balance + amount;
    if (transactionType === SavingTransactionType.WITHDRAW)
      return balance - amount;
    return balance;
  }

  private guardWithdrawReason(
    transactionType: SavingTransactionType,
    withdrawReasonId?: string,
  ): void {
    if (
      transactionType === SavingTransactionType.WITHDRAW &&
      !withdrawReasonId
    ) {
      throw new BadRequestException(
        'withdraw_reason_id is required for WITHDRAW transactions',
      );
    }
  }

  private async getStudentWithRelations(
    studentId: string,
  ): Promise<Student | null> {
    return await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.branch', 'branch')
      .where('student.id = :studentId', { studentId })
      .getOne();
  }

  private formatMoney(value: string | number | null | undefined): string {
    return Number(value ?? 0).toFixed(2);
  }

  /**
   * Checks that requestedAmount does not exceed the banked available balance
   * for the owner (student or class). Only deposits where bank_deposited_by
   * IS NOT NULL count — amounts still in transit (pending, teacher_submitted,
   * admin_received) are locked and cannot be withdrawn.
   *
   * Throws BadRequestException with a clear breakdown if check fails.
   * Only runs for WITHDRAW transactions — DEPOSIT always passes.
   */
  private async guardAvailableBalance(
    transactionType: SavingTransactionType,
    ownerType: SavingOwnerType,
    requestedAmount: number,
    studentId?: string | null,
    classId?: string | null,
  ): Promise<void> {
    if (transactionType !== SavingTransactionType.WITHDRAW) return;

    let available = 0;
    let ownerLabel = '';

    if (ownerType === SavingOwnerType.STUDENT && studentId) {
      available = await this.payReceiveService.getAvailableBalanceByStudent(studentId);
      ownerLabel = `student ${studentId}`;
    } else if (ownerType === SavingOwnerType.CLASS && classId) {
      available = await this.payReceiveService.getAvailableBalanceByClass(classId);
      ownerLabel = `class ${classId}`;
    } else {
      throw new BadRequestException('Cannot check available balance: missing owner id');
    }

    if (requestedAmount > available) {
      throw new BadRequestException(
        `Insufficient available balance for ${ownerLabel}. ` +
        `Requested: ${requestedAmount}, Available (banked): ${available}. ` +
        `Deposits not yet confirmed by bank cannot be withdrawn.`,
      );
    }
  }

  // ===========================================================================
  // WALLET RECALCULATION
  // ===========================================================================

  /**
   * Rebuilds opening_balance / closing_balance for every non-deleted saving row
   * for this student in chronological order, then writes the final balance back
   * to student.saving_wallet.
   *
   * Call after ANY insert, update, or soft-delete on a STUDENT saving.
   */
  async recalculateStudentBalances(studentId: string): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const savings = await this.savingRepository.find({
      where: { student_id: studentId, is_deleted: false },
      order: { created_at: 'ASC', updated_at: 'ASC' },
    });

    let running = 0;
    for (const item of savings) {
      const amount = Number(item.amount);
      item.opening_balance = running;
      const next = this.applyTransaction(running, item.transaction_type, amount);
      if (next < 0) {
        throw new BadRequestException(
          `Saving balance cannot be negative for student ${studentId}`,
        );
      }
      item.closing_balance = next;
      running = next;
    }

    if (savings.length > 0) await this.savingRepository.save(savings);

    (student as any).saving_wallet = running.toFixed(2);
    await this.studentRepository.save(student);
  }

  /**
   * Rebuilds opening_balance / closing_balance for every non-deleted CLASS saving
   * in chronological order, then writes the final balance back to class.saving_wallet.
   *
   * Call after ANY insert, update, or soft-delete on a CLASS saving.
   */
  async recalculateClassBalance(classId: string): Promise<void> {
    const classInfo = await this.classRepository.findOne({
      where: { id: classId },
    });
    if (!classInfo) throw new NotFoundException('Class not found');

    const savings = await this.savingRepository.find({
      where: {
        owner_type: SavingOwnerType.CLASS,
        class_id: classId,
        is_deleted: false,
      },
      order: { created_at: 'ASC', updated_at: 'ASC' },
    });

    let running = 0;
    for (const item of savings) {
      const amount = Number(item.amount);
      item.opening_balance = running;
      const next = this.applyTransaction(running, item.transaction_type, amount);
      if (next < 0) {
        throw new BadRequestException(
          `Class balance cannot be negative for class ${classId}`,
        );
      }
      item.closing_balance = next;
      running = next;
    }

    if (savings.length > 0) await this.savingRepository.save(savings);

    (classInfo as any).saving_wallet = running.toFixed(2);
    await this.classRepository.save(classInfo);
  }

  // ===========================================================================
  // PAY-RECEIVE HELPER
  // ===========================================================================

  private async createPayReceive(
    saving: Saving,
    initiatedBy?: string | null,
  ): Promise<PayReceive> {
    const flowType =
      saving.transaction_type === SavingTransactionType.WITHDRAW
        ? PayReceiveFlowType.WITHDRAWAL
        : PayReceiveFlowType.DEPOSIT;

    const payReceive = this.payReceiveRepository.create({
      saving_id: saving.id,
      amount: saving.amount,
      flow_type: flowType,
      status: PayReceiveStatus.PENDING,
      initiated_by: initiatedBy ?? saving.created_by,
      is_deleted: false,
    });
    return await this.payReceiveRepository.save(payReceive);
  }

  // ===========================================================================
  // CREATE — SINGLE
  // ===========================================================================

  async create(createSavingDto: CreateSavingDto): Promise<Saving> {
    const {
      owner_type,
      created_by,
      student_id,
      class_id,
      branch_id,
      academic_year_id,
      transaction_type,
      amount,
      note,
      withdraw_reason_id,
    } = createSavingDto;

    this.guardWithdrawReason(transaction_type, withdraw_reason_id);

    // ── STUDENT ──────────────────────────────────────────────────────────────
    if (owner_type === SavingOwnerType.STUDENT) {
      if (!student_id) throw new BadRequestException('student_id is required');

      const student = await this.getStudentWithRelations(student_id);
      if (!student) throw new NotFoundException('Student not found');

      const studentData = student as any;
      const currentBalance = Number(studentData.saving_wallet ?? 0);
      const nextBalance = this.applyTransaction(
        currentBalance,
        transaction_type,
        Number(amount),
      );

      if (nextBalance < 0)
        throw new BadRequestException('Insufficient balance');

      // ✅ For WITHDRAW: check banked available balance (bank_deposited_by IS NOT NULL).
      // Deposits not yet confirmed by bank are locked and cannot be withdrawn.
      await this.guardAvailableBalance(
        transaction_type,
        SavingOwnerType.STUDENT,
        Number(amount),
        student.id,
        null,
      );

      const saving = this.savingRepository.create({
        owner_type: SavingOwnerType.STUDENT,
        created_by,
        student_id: student.id,
        class_id: null,
        branch_id: studentData.branch?.id ?? null,
        academic_year_id: null,
        transaction_type,
        opening_balance: currentBalance,
        amount: Number(amount),
        closing_balance: nextBalance,
        note,
        withdraw_reason_id: withdraw_reason_id ?? null,
        is_active: true,
        is_deleted: false,
      } as DeepPartial<Saving>);

      const created = await this.savingRepository.save(saving);
      await this.recalculateStudentBalances(student.id);
      await this.createPayReceive(created);

      return await this.findOne(created.id);
    }

    // ── CLASS ─────────────────────────────────────────────────────────────────
    if (owner_type === SavingOwnerType.CLASS) {
      if (!class_id) throw new BadRequestException('class_id is required');
      if (!branch_id) throw new BadRequestException('branch_id is required');
      if (!academic_year_id)
        throw new BadRequestException('academic_year_id is required');

      const classInfo = await this.classRepository.findOne({
        where: { id: class_id },
      });
      if (!classInfo) throw new NotFoundException('Class not found');

      const last = await this.savingRepository.findOne({
        where: { owner_type: SavingOwnerType.CLASS, class_id, is_deleted: false },
        order: { created_at: 'DESC', updated_at: 'DESC' },
      });

      const currentBalance = Number(last?.closing_balance ?? 0);
      const nextBalance = this.applyTransaction(
        currentBalance,
        transaction_type,
        Number(amount),
      );

      if (nextBalance < 0)
        throw new BadRequestException('Insufficient class balance');

      // ✅ For WITHDRAW: check banked available balance.
      await this.guardAvailableBalance(
        transaction_type,
        SavingOwnerType.CLASS,
        Number(amount),
        null,
        class_id,
      );

      const saving = this.savingRepository.create({
        owner_type: SavingOwnerType.CLASS,
        created_by,
        student_id: null,
        class_id,
        branch_id,
        academic_year_id,
        transaction_type,
        opening_balance: currentBalance,
        amount: Number(amount),
        closing_balance: nextBalance,
        note,
        withdraw_reason_id: withdraw_reason_id ?? null,
        is_active: true,
        is_deleted: false,
      } as DeepPartial<Saving>);

      const created = await this.savingRepository.save(saving);

      // ✅ FIX: update class.saving_wallet after every class saving write
      await this.recalculateClassBalance(class_id);
      await this.createPayReceive(created);

      return await this.findOne(created.id);
    }

    throw new BadRequestException('Invalid owner_type');
  }

  // ===========================================================================
  // CREATE — CLASS SAVING
  // ===========================================================================

  async createClassSaving(dto: CreateClassSavingDto): Promise<Saving> {
    const {
      created_by,
      class_id,
      branch_id,
      academic_year_id,
      transaction_type,
      amount,
      note,
      withdraw_reason_id,
    } = dto;

    this.guardWithdrawReason(transaction_type, withdraw_reason_id);

    const classInfo = await this.classRepository.findOne({
      where: { id: class_id },
    });
    if (!classInfo) throw new NotFoundException('Class not found');

    const last = await this.savingRepository.findOne({
      where: { owner_type: SavingOwnerType.CLASS, class_id, is_deleted: false },
      order: { created_at: 'DESC', updated_at: 'DESC' },
    });

    const currentBalance = Number(last?.closing_balance ?? 0);
    const nextBalance = this.applyTransaction(
      currentBalance,
      transaction_type,
      Number(amount),
    );

    if (nextBalance < 0)
      throw new BadRequestException('Insufficient class balance');

    // ✅ For WITHDRAW: check banked available balance.
    await this.guardAvailableBalance(
      transaction_type,
      SavingOwnerType.CLASS,
      Number(amount),
      null,
      class_id,
    );

    const saving = this.savingRepository.create({
      owner_type: SavingOwnerType.CLASS,
      created_by,
      student_id: null,
      class_id,
      branch_id,
      academic_year_id,
      transaction_type,
      opening_balance: currentBalance,
      amount: Number(amount),
      closing_balance: nextBalance,
      note,
      withdraw_reason_id: withdraw_reason_id ?? null,
      is_active: true,
      is_deleted: false,
    } as DeepPartial<Saving>);

    const created = await this.savingRepository.save(saving);

    // ✅ FIX: update class.saving_wallet
    await this.recalculateClassBalance(class_id);
    await this.createPayReceive(created);

    return await this.findOne(created.id);
  }

  // ===========================================================================
  // CREATE — STUDENTS SAVING SESSION
  // ===========================================================================

  async createStudentsSavingSession(
    dto: CreateStudentsSavingSessionDto,
  ): Promise<SavingSession> {
    const {
      created_by,
      class_id,
      branch_id,
      academic_year_id,
      transaction_type,
      shared_note,
      students,
      withdraw_reason_id,
    } = dto;

    if (!students || students.length === 0)
      throw new BadRequestException('students must not be empty');

    this.guardWithdrawReason(transaction_type, withdraw_reason_id);

    const session = await this.savingSessionRepository.save(
      this.savingSessionRepository.create({
        created_by,
        class_id: class_id ?? null,
        branch_id: branch_id ?? null,
        academic_year_id: academic_year_id ?? null,
        transaction_type,
        note: shared_note ?? null,
        withdraw_reason_id: withdraw_reason_id ?? null,
        total_students: students.length,
        total_amount: 0,
        success_count: 0,
        failed_count: 0,
      }),
    );

    let totalAmount = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const entry of students) {
      try {
        const effectiveReasonId = entry.withdraw_reason_id ?? withdraw_reason_id;
        this.guardWithdrawReason(transaction_type, effectiveReasonId);

        const student = await this.getStudentWithRelations(entry.student_id);
        if (!student) { failedCount++; continue; }

        const studentData = student as any;
        const currentBalance = Number(studentData.saving_wallet ?? 0);
        const nextBalance = this.applyTransaction(
          currentBalance,
          transaction_type,
          Number(entry.amount),
        );

        if (nextBalance < 0) { failedCount++; continue; }

        // ✅ For WITHDRAW: check banked available balance per student.
        if (transaction_type === SavingTransactionType.WITHDRAW) {
          const available = await this.payReceiveService.getAvailableBalanceByStudent(student.id);
          if (Number(entry.amount) > available) { failedCount++; continue; }
        }

        const saving = this.savingRepository.create({
          owner_type: SavingOwnerType.STUDENT,
          created_by,
          session_id: session.id,
          student_id: student.id,
          class_id: studentData.classId?.id ?? null,
          branch_id: studentData.branch?.id ?? null,
          academic_year_id: studentData.academicYear?.id ?? null,
          transaction_type,
          opening_balance: currentBalance,
          amount: Number(entry.amount),
          closing_balance: nextBalance,
          withdraw_reason_id: effectiveReasonId ?? null,
          is_active: true,
          is_deleted: false,
        } as DeepPartial<Saving>);

        const created = await this.savingRepository.save(saving);
        await this.recalculateStudentBalances(student.id);
        await this.createPayReceive(created);

        totalAmount += Number(entry.amount);
        successCount++;
      } catch {
        failedCount++;
      }
    }

    session.total_amount = totalAmount;
    session.success_count = successCount;
    session.failed_count = failedCount;
    await this.savingSessionRepository.save(session);

    const result = await this.savingSessionRepository.findOne({
      where: { id: session.id },
      relations: {
        createdBy: true,
        class: true,
        branch: true,
        academic_year: true,
        withdrawReason: true,
        savings: { student: true, withdrawReason: true },
      },
    });
    if (!result) throw new NotFoundException('Session not found after creation');
    return result;
  }

  // ===========================================================================
  // CREATE — BULK
  // ===========================================================================

  async createBulk(dto: CreateBulkSavingDto): Promise<{
    total: number;
    success_count: number;
    failed_count: number;
    success: Saving[];
    failed: { student_id: string; reason: string }[];
  }> {
    const { created_by, student_ids, transaction_type, amount, note, withdraw_reason_id } = dto;

    if (!student_ids || student_ids.length === 0)
      throw new BadRequestException('student_ids must not be empty');

    this.guardWithdrawReason(transaction_type, withdraw_reason_id);

    const success: Saving[] = [];
    const failed: { student_id: string; reason: string }[] = [];

    for (const student_id of student_ids) {
      try {
        const student = await this.getStudentWithRelations(student_id);
        if (!student) { failed.push({ student_id, reason: 'Student not found' }); continue; }

        const studentData = student as any;
        const currentBalance = Number(studentData.saving_wallet ?? 0);
        const nextBalance = this.applyTransaction(currentBalance, transaction_type, Number(amount));

        if (nextBalance < 0) { failed.push({ student_id, reason: 'Insufficient balance' }); continue; }

        // ✅ For WITHDRAW: check banked available balance per student.
        if (transaction_type === SavingTransactionType.WITHDRAW) {
          const available = await this.payReceiveService.getAvailableBalanceByStudent(student.id);
          if (Number(amount) > available) {
            failed.push({ student_id, reason: `Insufficient banked balance. Available: ${available}, Requested: ${amount}` });
            continue;
          }
        }

        const saving = this.savingRepository.create({
          owner_type: SavingOwnerType.STUDENT,
          created_by,
          student_id: student.id,
          class_id: studentData.classId?.id ?? null,
          branch_id: studentData.branch?.id ?? null,
          academic_year_id: studentData.academicYear?.id ?? null,
          transaction_type,
          opening_balance: currentBalance,
          amount: Number(amount),
          closing_balance: nextBalance,
          note,
          withdraw_reason_id: withdraw_reason_id ?? null,
          is_active: true,
          is_deleted: false,
        } as DeepPartial<Saving>);

        const created = await this.savingRepository.save(saving);
        await this.recalculateStudentBalances(student.id);
        await this.createPayReceive(created);

        success.push(await this.findOne(created.id));
      } catch (err: any) {
        failed.push({ student_id, reason: err?.message ?? 'Unknown error' });
      }
    }

    return { total: student_ids.length, success_count: success.length, failed_count: failed.length, success, failed };
  }

  // ===========================================================================
  // CREATE — BULK BY CLASS
  // ===========================================================================

  async createBulkByClass(dto: CreateBulkSavingByClassDto): Promise<{
    total: number;
    success_count: number;
    failed_count: number;
    success: Saving[];
    failed: { student_id: string; reason: string }[];
  }> {
    const classInfo = await this.classRepository.findOne({ where: { id: dto.class_id } });
    if (!classInfo) throw new NotFoundException('Class not found');

    const students = await this.studentRepository.find({
      where: { classId: { id: dto.class_id }, is_deleted: false } as any,
      select: ['id'] as any,
    });
    if (!students.length) throw new NotFoundException('No students found in this class');

    return this.createBulk({
      created_by: dto.created_by,
      student_ids: students.map((s) => s.id),
      transaction_type: dto.transaction_type,
      amount: dto.amount,
      note: dto.note,
      withdraw_reason_id: dto.withdraw_reason_id ?? undefined,
    });
  }

  // ===========================================================================
  // CREATE — PARENT WITHDRAWAL
  // ===========================================================================

  async createParentWithdrawal(dto: {
    studentId: string;
    amount: number;
    note?: string;
    withdrawReasonId?: string;
  }): Promise<{ saving: Saving; payReceive: PayReceive }> {
    if (!dto.withdrawReasonId)
      throw new BadRequestException('withdraw_reason_id is required for withdrawals');

    const student = await this.getStudentWithRelations(dto.studentId);
    if (!student) throw new NotFoundException('Student not found');

    const studentData = student as any;
    const currentBalance = Number(studentData.saving_wallet ?? 0);

    if (dto.amount > currentBalance)
      throw new BadRequestException(
        `Insufficient balance. Current: ${currentBalance}, Requested: ${dto.amount}`,
      );

    // ✅ Check banked available balance — ledger balance ≠ withdrawable balance.
    await this.guardAvailableBalance(
      SavingTransactionType.WITHDRAW,
      SavingOwnerType.STUDENT,
      dto.amount,
      student.id,
      null,
    );

    const nextBalance = currentBalance - dto.amount;

    const saving = this.savingRepository.create({
      owner_type: SavingOwnerType.STUDENT,
      // `created_by` has a FK to `admins` — a parent-initiated withdrawal has
      // no admin actor, so it's omitted (column is nullable). The requesting
      // student is tracked via `student_id` (and passed separately as
      // `initiated_by` below).
      student_id: student.id,
      branch_id: studentData.branch?.id ?? null,
      transaction_type: SavingTransactionType.WITHDRAW,
      opening_balance: currentBalance,
      amount: dto.amount,
      closing_balance: nextBalance,
      note: dto.note,
      withdraw_reason_id: dto.withdrawReasonId,
      is_active: true,
      is_deleted: false,
    } as DeepPartial<Saving>);

    const created = await this.savingRepository.save(saving);
    await this.recalculateStudentBalances(student.id);
    const payReceive = await this.createPayReceive(created, dto.studentId);

    return {
      saving: await this.findOne(created.id),
      payReceive,
    };
  }

  // ===========================================================================
  // FIND
  // ===========================================================================

  async findAll(): Promise<Saving[]> {
    return await this.savingRepository.find({
      where: { is_deleted: false },
      relations: { student: true, class: true, branch: true, academic_year: true, createdBy: true, withdrawReason: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Saving> {
    const saving = await this.savingRepository.findOne({
      where: { id, is_deleted: false },
      relations: { student: true, class: true, branch: true, academic_year: true, createdBy: true, withdrawReason: true },
    });
    if (!saving) throw new NotFoundException('Saving not found');
    return saving;
  }

  async getSavingHistoryByStudent(studentId: string): Promise<Saving[]> {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    return await this.savingRepository.find({
      where: { student_id: studentId, is_deleted: false },
      relations: { student: true, class: true, branch: true, academic_year: true, createdBy: true, withdrawReason: true },
      order: { created_at: 'DESC' },
    });
  }

  // ===========================================================================
  // UPDATE
  // ===========================================================================

  async update(id: string, updateSavingDto: UpdateSavingDto): Promise<Saving> {
    const saving = await this.savingRepository.findOne({ where: { id, is_deleted: false } });
    if (!saving) throw new NotFoundException('Saving not found');
    if (!saving.student_id) throw new BadRequestException('Saving.student_id is missing');

    const oldStudentId = saving.student_id;
    const nextStudentId = updateSavingDto.student_id ?? oldStudentId;
    const student = await this.getStudentWithRelations(nextStudentId);
    if (!student) throw new NotFoundException('Student not found');

    const studentData = student as any;
    if (updateSavingDto.student_id !== undefined) {
      saving.owner_type = SavingOwnerType.STUDENT;
      saving.student_id = student.id;
      saving.class_id = null;
      saving.branch_id = studentData.branch?.id ?? null;
      saving.academic_year_id = null;
    }
    if (updateSavingDto.transaction_type !== undefined) saving.transaction_type = updateSavingDto.transaction_type;
    if (updateSavingDto.amount !== undefined) saving.amount = Number(updateSavingDto.amount);
    if (updateSavingDto.note !== undefined) saving.note = updateSavingDto.note;
    if (updateSavingDto.withdraw_reason_id !== undefined)
      saving.withdraw_reason_id = updateSavingDto.withdraw_reason_id ?? null;

    const updated = await this.savingRepository.save(saving);
    await this.recalculateStudentBalances(oldStudentId);
    if (saving.student_id && saving.student_id !== oldStudentId)
      await this.recalculateStudentBalances(saving.student_id);

    return await this.findOne(updated.id);
  }

  // ===========================================================================
  // UPDATE SAVING AMOUNT (called by pay-receive on teacher resubmit)
  // ===========================================================================

  /**
   * Updates the amount on a single saving row then rebuilds opening/closing
   * balances and the wallet for the correct owner (STUDENT or CLASS).
   *
   * Called by PayReceiveService.teacherResubmitWithdrawal() when the teacher
   * changes the withdrawal amount after an admin rejection.
   *
   * Example — class wallet:
   *   Saving was 100 kip WITHDRAW → class.saving_wallet = 400 (was 500).
   *   Teacher resubmits 80 kip → amount updated to 80,
   *   recalculate rebuilds: 500 - 80 = 420 → class.saving_wallet = 420.
   *
   * Example — student wallet:
   *   Same logic — recalculateStudentBalances() replays all rows so the
   *   wallet reflects the corrected amount automatically.
   */
  async updateSavingAmount(savingId: string, newAmount: number): Promise<Saving> {
    const saving = await this.savingRepository.findOne({
      where: { id: savingId, is_deleted: false },
    });
    if (!saving) throw new NotFoundException(`Saving "${savingId}" not found`);
    if (newAmount <= 0) throw new BadRequestException('amount must be greater than 0');

    saving.amount = newAmount;
    await this.savingRepository.save(saving);

    if (saving.owner_type === SavingOwnerType.STUDENT && saving.student_id) {
      await this.recalculateStudentBalances(saving.student_id);
    } else if (saving.owner_type === SavingOwnerType.CLASS && saving.class_id) {
      await this.recalculateClassBalance(saving.class_id);
    }

    return this.findOne(savingId);
  }

  // ===========================================================================
  // REMOVE
  // ===========================================================================

  /**
   * Soft-delete a STUDENT saving and recalculate the student wallet.
   * Called by pay-receive when super_admin rejects a student withdrawal
   * — recalculate restores the debited amount automatically.
   */
  async remove(id: string): Promise<{ message: string }> {
    const saving = await this.savingRepository.findOne({ where: { id, is_deleted: false } });
    if (!saving) throw new NotFoundException('Saving not found');

    saving.is_deleted = true;
    saving.is_active = false;
    await this.savingRepository.save(saving);

    if (saving.student_id)
      await this.recalculateStudentBalances(saving.student_id);

    return { message: 'Saving deleted successfully' };
  }

  /**
   * Soft-delete a CLASS saving and recalculate the class wallet.
   * Called by pay-receive when super_admin rejects a class withdrawal
   * — recalculate restores the debited amount automatically.
   *
   * ✅ FIX: now calls recalculateClassBalance so class.saving_wallet is restored.
   */
  async removeClassSaving(id: string): Promise<{ message: string }> {
    const saving = await this.savingRepository.findOne({ where: { id, is_deleted: false } });
    if (!saving) throw new NotFoundException('Saving not found');
    if (saving.owner_type !== SavingOwnerType.CLASS)
      throw new BadRequestException('This method is only for CLASS savings');

    saving.is_deleted = true;
    saving.is_active = false;
    await this.savingRepository.save(saving);

    // ✅ FIX: restore class wallet after soft-delete
    if (saving.class_id)
      await this.recalculateClassBalance(saving.class_id);

    return { message: 'Class saving deleted successfully' };
  }

  // ===========================================================================
  // BALANCE QUERIES
  // ===========================================================================

  async getStudentBalance(studentId: string) {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const studentData = student as any;
    return {
      student_id: student.id,
      student_code: studentData.student_id,
      student_name: `${studentData.first_name ?? ''} ${studentData.last_name ?? ''}`.trim(),
      current_balance: Number(studentData.saving_wallet ?? 0),
    };
  }

  async getClassBalance(classId: string) {
    const classInfo = await this.classRepository.findOne({ where: { id: classId } });
    if (!classInfo) throw new NotFoundException('Class not found');

    // ✅ FIX: read from class.saving_wallet (maintained by recalculateClassBalance)
    // instead of summing saving rows on the fly
    return {
      class_id: classId,
      current_balance: Number((classInfo as any).saving_wallet ?? 0),
    };
  }

  async getClassBalanceWithStudents(classId: string) {
    const classInfo = await this.classRepository.findOne({ where: { id: classId } });
    if (!classInfo) throw new NotFoundException('Class not found');

    const classSavings = await this.savingRepository.find({
      where: { owner_type: SavingOwnerType.CLASS, class_id: classId, is_deleted: false },
      relations: { createdBy: true, withdrawReason: true },
      order: { created_at: 'ASC', updated_at: 'ASC' },
    });

    const classBalance = Number((classInfo as any).saving_wallet ?? 0);

    const classDepositTotal = classSavings
      .filter((i) => i.transaction_type === SavingTransactionType.DEPOSIT)
      .reduce((s, i) => s + Number(i.amount), 0);
    const classWithdrawTotal = classSavings
      .filter((i) => i.transaction_type === SavingTransactionType.WITHDRAW)
      .reduce((s, i) => s + Number(i.amount), 0);

    const students = await this.studentRepository.find({
      where: { classId: { id: classId }, is_deleted: false } as any,
      relations: { classId: true, branch: true, academicYear: true } as any,
      order: { createdAt: 'ASC' },
    });

    const studentIds = students.map((s: any) => s.id);
    let studentSavings: Saving[] = [];
    if (studentIds.length > 0) {
      studentSavings = await this.savingRepository.find({
        where: { owner_type: SavingOwnerType.STUDENT, student_id: In(studentIds), is_deleted: false },
        relations: { createdBy: true, withdrawReason: true },
        order: { created_at: 'ASC', updated_at: 'ASC' },
      });
    }

    const savingMap = new Map<string, Saving[]>();
    for (const item of studentSavings) {
      const key = item.student_id ?? '';
      if (!savingMap.has(key)) savingMap.set(key, []);
      savingMap.get(key)!.push(item);
    }

    return {
      class_id: classId,
      class_name: (classInfo as any).name ?? null,
      class_balance: classBalance,
      class_summary: {
        deposit_total: classDepositTotal,
        withdraw_total: classWithdrawTotal,
        total_transactions: classSavings.length,
      },
      class_history: classSavings.map((item) => ({
        id: item.id,
        transaction_type: item.transaction_type,
        opening_balance: this.formatMoney(item.opening_balance),
        amount: this.formatMoney(item.amount),
        closing_balance: this.formatMoney(item.closing_balance),
        note: item.note ?? null,
        withdraw_reason: item.withdrawReason ?? null,
        created_by: item.createdBy ?? null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
      total_students: students.length,
      students: students.map((student: any) => {
        const histories = savingMap.get(student.id) ?? [];
        const depositTotal = histories.filter((i) => i.transaction_type === SavingTransactionType.DEPOSIT).reduce((s, i) => s + Number(i.amount), 0);
        const withdrawTotal = histories.filter((i) => i.transaction_type === SavingTransactionType.WITHDRAW).reduce((s, i) => s + Number(i.amount), 0);
        return {
          id: student.id,
          student_id: student.student_id,
          first_name: student.first_name,
          last_name: student.last_name,
          full_name: `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim(),
          gender: student.gender,
          profile_image_path: student.profile_image_path,
          saving_wallet: Number(student.saving_wallet ?? 0),
          class: null,
          branch: student.branch,
          academic_year: null,
          summary: { deposit_total: depositTotal, withdraw_total: withdrawTotal, total_transactions: histories.length },
          history: histories.map((item) => ({
            id: item.id,
            transaction_type: item.transaction_type,
            opening_balance: Number(item.opening_balance),
            amount: Number(item.amount),
            closing_balance: Number(item.closing_balance),
            note: item.note ?? null,
            withdraw_reason: item.withdrawReason ?? null,
            created_by: item.createdBy ?? null,
            created_at: item.created_at,
            updated_at: item.updated_at,
          })),
        };
      }),
    };
  }
}
