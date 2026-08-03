import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PayReceive,
  PayReceiveFlowType,
  PayReceiveStatus,
} from './pay-receive.entity';
import {
  AdminConfirmWithdrawalDto,
  AdminRejectWithdrawalDto,
  SuperAdminRejectClassWithdrawalDto,
  AdminReceiveDto,
  BankDepositDto,
  CreatePayReceiveDto,
  CreateWithdrawalDto,
  ParentReceiveDto,
  RejectDto,
  SuperAdminApproveWithdrawalDto,
  SuperAdminConfirmDepositDto,
  SuperAdminRejectWithdrawalDto,
  TeacherReceiveDto,
  TeacherResubmitDto,
  TeacherSubmitDto,
  UnlockForEditDto,
  UpdatePayReceiveDto,
} from './dto/pay-receive.dto';
import { SavingsService } from '../savings/savings.service';
import { SavingOwnerType } from '../savings/savings.entity';

@Injectable()
export class PayReceiveService {
  constructor(
    @InjectRepository(PayReceive)
    private readonly payReceiveRepo: Repository<PayReceive>,

    @Inject(forwardRef(() => SavingsService))
    private readonly savingsService: SavingsService,
  ) {}

  // ===========================================================================
  // PRIVATE GUARDS
  // ===========================================================================

  private withRelations() {
    return {
      saving: { student: true, class: true, branch: true, academic_year: true },
    } as const;
  }

  private guardStatus(record: PayReceive, required: PayReceiveStatus, action: string): void {
    if (record.status !== required)
      throw new BadRequestException(`Cannot "${action}": status is "${record.status}", expected "${required}"`);
  }

  private guardNotDeleted(record: PayReceive): void {
    if (record.is_deleted) throw new BadRequestException('This record has been soft-deleted');
  }

  private guardFlowType(record: PayReceive, expected: PayReceiveFlowType, action: string): void {
    if (record.flow_type !== expected)
      throw new BadRequestException(`Cannot "${action}": endpoint is for flow_type="${expected}" but record is "${record.flow_type}"`);
  }

  private guardCanEdit(record: PayReceive, action: string): void {
    if (!record.can_edit)
      throw new BadRequestException(`Cannot "${action}": super admin has not yet enabled editing on this record (can_edit = false)`);
  }

  // ===========================================================================
  // BALANCE HELPERS (per saving_id — used for pay-receive level checks)
  // ===========================================================================

  /**
   * Sum of all non-rejected withdrawal amounts for a single saving record.
   * In-flight withdrawals (pending, admin_confirmed, super_admin_approved) count
   * as "spoken for" to prevent double-spending.
   */
  private async getWithdrawnAmountBySaving(savingId: string): Promise<number> {
    const EXCLUDED: PayReceiveStatus[] = [
      PayReceiveStatus.SUPER_ADMIN_REJECTED,
      PayReceiveStatus.ADMIN_REJECTED,
      PayReceiveStatus.REJECTED,
    ];
    const result = await this.payReceiveRepo
      .createQueryBuilder('pr')
      .select('COALESCE(SUM(pr.amount), 0)', 'total')
      .where('pr.saving_id = :savingId', { savingId })
      .andWhere('pr.flow_type = :type', { type: PayReceiveFlowType.WITHDRAWAL })
      .andWhere('pr.status NOT IN (:...excluded)', { excluded: EXCLUDED })
      .andWhere('pr.is_deleted = false')
      .getRawOne<{ total: string }>();
    return parseFloat(result?.total ?? '0');
  }

  /**
   * Returns banked balance minus active withdrawals for a single saving_id.
   * Only deposits where bank_deposited_by IS NOT NULL count — pending deposits
   * locked in transit cannot be withdrawn.
   */
  async getAvailableBalance(savingId: string): Promise<number> {
    const depositResult = await this.payReceiveRepo
      .createQueryBuilder('pr')
      .select('COALESCE(SUM(pr.amount), 0)', 'total')
      .where('pr.saving_id = :savingId', { savingId })
      .andWhere('pr.flow_type = :type', { type: PayReceiveFlowType.DEPOSIT })
      .andWhere('pr.bank_deposited_by IS NOT NULL')
      .andWhere('pr.is_deleted = false')
      .getRawOne<{ total: string }>();

    const banked = parseFloat(depositResult?.total ?? '0');
    const withdrawn = await this.getWithdrawnAmountBySaving(savingId);
    return Math.max(banked - withdrawn, 0);
  }

  /**
   * Returns available balance scoped to a student (across all their saving records).
   * Use this for withdrawal eligibility checks when the withdrawal ties to a student.
   */
  async getAvailableBalanceByStudent(studentId: string): Promise<number> {
    const savingIds = await this.payReceiveRepo
      .createQueryBuilder('pr')
      .innerJoin('pr.saving', 's')
      .select('DISTINCT pr.saving_id', 'saving_id')
      .where('s.student_id = :studentId', { studentId })
      .andWhere('s.is_deleted = false')
      .getRawMany<{ saving_id: string }>();

    if (!savingIds.length) return 0;
    const ids = savingIds.map((r) => r.saving_id);
    return this._sumAvailable(ids);
  }

  async getStudentAvailableBalanceBreakdown(studentId: string): Promise<{
    studentId: string;
    totalBalance: number;
    availableBalance: number;
    nonAvailableBalance: number;
  }> {
    const totalBalance = Number(
      (await this.savingsService.getStudentBalance(studentId)).current_balance ?? 0,
    );
    const rawAvailableBalance = await this.getAvailableBalanceByStudent(studentId);
    const availableBalance = Math.min(
      Math.max(rawAvailableBalance, 0),
      totalBalance,
    );
    const nonAvailableBalance = Math.max(totalBalance - availableBalance, 0);
    return {
      studentId,
      totalBalance,
      availableBalance,
      nonAvailableBalance,
    };
  }

  /**
   * Returns available balance scoped to a class (across all class saving records).
   */
  async getAvailableBalanceByClass(classId: string): Promise<number> {
    const savingIds = await this.payReceiveRepo
      .createQueryBuilder('pr')
      .innerJoin('pr.saving', 's')
      .select('DISTINCT pr.saving_id', 'saving_id')
      .where('s.class_id = :classId', { classId })
      .andWhere('s.is_deleted = false')
      .getRawMany<{ saving_id: string }>();

    if (!savingIds.length) return 0;
    const ids = savingIds.map((r) => r.saving_id);
    return this._sumAvailable(ids);
  }

  private async _sumAvailable(ids: string[]): Promise<number> {
    const EXCLUDED: PayReceiveStatus[] = [
      PayReceiveStatus.SUPER_ADMIN_REJECTED,
      PayReceiveStatus.ADMIN_REJECTED,
      PayReceiveStatus.REJECTED,
    ];

    const [depositResult, withdrawResult] = await Promise.all([
      this.payReceiveRepo
        .createQueryBuilder('pr')
        .select('COALESCE(SUM(pr.amount), 0)', 'total')
        .where('pr.saving_id IN (:...ids)', { ids })
        .andWhere('pr.flow_type = :type', { type: PayReceiveFlowType.DEPOSIT })
        .andWhere('pr.bank_deposited_by IS NOT NULL')
        .andWhere('pr.is_deleted = false')
        .getRawOne<{ total: string }>(),

      this.payReceiveRepo
        .createQueryBuilder('pr')
        .select('COALESCE(SUM(pr.amount), 0)', 'total')
        .where('pr.saving_id IN (:...ids)', { ids })
        .andWhere('pr.flow_type = :type', { type: PayReceiveFlowType.WITHDRAWAL })
        .andWhere('pr.status NOT IN (:...excluded)', { excluded: EXCLUDED })
        .andWhere('pr.is_deleted = false')
        .getRawOne<{ total: string }>(),
    ]);

    return Math.max(
      parseFloat(depositResult?.total ?? '0') -
        parseFloat(withdrawResult?.total ?? '0'),
      0,
    );
  }

  /**
   * Throws BadRequestException with breakdown if requestedAmount exceeds available.
   */
  private async validateWithdrawalAmount(savingId: string, requestedAmount: number): Promise<void> {
    const available = await this.getAvailableBalance(savingId);
    if (requestedAmount > available) {
      const [bankedResult, pendingResult] = await Promise.all([
        this.payReceiveRepo
          .createQueryBuilder('pr')
          .select('COALESCE(SUM(pr.amount), 0)', 'total')
          .where('pr.saving_id = :savingId', { savingId })
          .andWhere('pr.flow_type = :type', { type: PayReceiveFlowType.DEPOSIT })
          .andWhere('pr.bank_deposited_by IS NOT NULL')
          .andWhere('pr.is_deleted = false')
          .getRawOne<{ total: string }>(),

        this.payReceiveRepo
          .createQueryBuilder('pr')
          .select('COALESCE(SUM(pr.amount), 0)', 'total')
          .where('pr.saving_id = :savingId', { savingId })
          .andWhere('pr.flow_type = :type', { type: PayReceiveFlowType.DEPOSIT })
          .andWhere('pr.bank_deposited_by IS NULL')
          .andWhere('pr.is_deleted = false')
          .getRawOne<{ total: string }>(),
      ]);

      throw new BadRequestException(
        `Insufficient balance. Requested: ${requestedAmount}, Available: ${available} ` +
        `(banked: ${parseFloat(bankedResult?.total ?? '0')}, ` +
        `pending not yet in bank: ${parseFloat(pendingResult?.total ?? '0')})`,
      );
    }
  }

  // ===========================================================================
  // CREATE
  // ===========================================================================

  async create(dto: CreatePayReceiveDto): Promise<PayReceive> {
    const record = this.payReceiveRepo.create({
      saving_id: dto.saving_id,
      amount: dto.amount,
      note: dto.note ?? null,
      initiated_by: dto.initiated_by ?? null,
      flow_type: PayReceiveFlowType.DEPOSIT,
      status: PayReceiveStatus.PENDING,
      can_edit: false,
      is_deleted: false,
    });
    return await this.payReceiveRepo.save(record);
  }

  async createWithdrawal(dto: CreateWithdrawalDto): Promise<PayReceive> {
    await this.validateWithdrawalAmount(dto.saving_id, dto.amount);
    const record = this.payReceiveRepo.create({
      saving_id: dto.saving_id,
      amount: dto.amount,
      note: dto.note ?? null,
      initiated_by: dto.initiated_by ?? null,
      flow_type: PayReceiveFlowType.WITHDRAWAL,
      status: PayReceiveStatus.PENDING,
      can_edit: false,
      is_deleted: false,
    });
    return await this.payReceiveRepo.save(record);
  }

  // ===========================================================================
  // FIND
  // ===========================================================================

  async findAll(): Promise<PayReceive[]> {
    return await this.payReceiveRepo.find({ where: { is_deleted: false }, relations: this.withRelations(), order: { created_at: 'DESC' } });
  }

  async findAllDeposits(): Promise<PayReceive[]> {
    return await this.payReceiveRepo.find({ where: { flow_type: PayReceiveFlowType.DEPOSIT, is_deleted: false }, relations: this.withRelations(), order: { created_at: 'DESC' } });
  }

  async findAllWithdrawals(): Promise<PayReceive[]> {
    return await this.payReceiveRepo.find({ where: { flow_type: PayReceiveFlowType.WITHDRAWAL, is_deleted: false }, relations: this.withRelations(), order: { created_at: 'DESC' } });
  }

  async findBySaving(savingId: string): Promise<PayReceive[]> {
    return await this.payReceiveRepo.find({ where: { saving_id: savingId, is_deleted: false }, relations: this.withRelations(), order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<PayReceive> {
    const record = await this.payReceiveRepo.findOne({ where: { id, is_deleted: false }, relations: this.withRelations() });
    if (!record) throw new NotFoundException(`PayReceive "${id}" not found`);
    return record;
  }

  // ===========================================================================
  // UPDATE (PENDING only)
  // ===========================================================================

   async update(id: string, dto: UpdatePayReceiveDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardStatus(record, PayReceiveStatus.PENDING, 'edit');
 
    const oldAmount = Number(record.amount);
    const newAmount = dto.amount !== undefined ? Number(dto.amount) : oldAmount;
 
    if (dto.amount !== undefined && newAmount !== oldAmount) {
      // ── WITHDRAW: check banked available balance before allowing edit ─────────
      // The current record already holds an oldAmount debit in the wallet.
      // We add it back to get "available if this withdrawal didn't exist",
      // then check whether newAmount fits within that headroom.
      //
      // Example:
      //   banked deposits = 300, active withdrawals (excl. this one) = 100
      //   oldAmount = 80  → available + 80 = 300 - 100 + 80 = 280 headroom
      //   newAmount = 250 → 250 ≤ 280 ✓ allowed
      //   newAmount = 290 → 290 > 280 ✗ rejected
      if (record.flow_type === PayReceiveFlowType.WITHDRAWAL) {
        const ownerType = record.saving?.owner_type;
        const studentId = record.saving?.student_id;
        const classId   = record.saving?.class_id;
 
        // ── 1. Total ledger balance (saving_wallet) ───────────────────────────
        // This is the full accounting balance — every deposit minus every
        // withdrawal regardless of bank status.
        const totalBalance =
          ownerType === SavingOwnerType.STUDENT && studentId
            ? (await this.savingsService.getStudentBalance(studentId)).current_balance
            : ownerType === SavingOwnerType.CLASS && classId
              ? (await this.savingsService.getClassBalance(classId)).current_balance
              : 0;
 
        // ── 2. Banked available balance (bank_deposited_by IS NOT NULL) ────────
        // Only deposits physically in the bank count.
        // Add back oldAmount so we don't penalise the record being edited.
        const bankedRaw =
          ownerType === SavingOwnerType.STUDENT && studentId
            ? await this.getAvailableBalanceByStudent(studentId)
            : ownerType === SavingOwnerType.CLASS && classId
              ? await this.getAvailableBalanceByClass(classId)
              : 0;
        const availableBanked = bankedRaw + oldAmount;
 
        // ── 3. Two-tier error messages ─────────────────────────────────────────
        if (newAmount > totalBalance + oldAmount) {
          // Exceeds even the total wallet — hard stop
          throw new BadRequestException(
            `Insufficient balance. ` +
            `Requested: ${newAmount}, ` +
            `Total wallet balance: ${totalBalance + oldAmount}.`,
          );
        }
 
        if (newAmount > availableBanked) {
          // Within total balance but exceeds what has been banked
          throw new BadRequestException(
            `Insufficient available balance. ` +
            `Requested: ${newAmount}, ` +
            `Available (banked): ${availableBanked}, ` +
            `Total wallet: ${totalBalance + oldAmount}. ` +
            `The remaining ${(totalBalance + oldAmount) - availableBanked} kip ` +
            `has not been deposited to the bank yet and cannot be withdrawn.`,
          );
        }
      }
 
      // ── Update saving row + recalculate wallet (DEPOSIT and WITHDRAW) ─────────
      // updateSavingAmount() writes saving.amount = newAmount then calls
      // recalculateStudentBalances() or recalculateClassBalance() so
      // student.saving_wallet / class.saving_wallet is always correct.
      await this.savingsService.updateSavingAmount(record.saving_id, newAmount);
    }
 
    // Apply remaining dto fields (note etc.) — amount handled explicitly above
    const { amount: _amount, ...rest } = dto;
    Object.assign(record, rest);
    if (dto.amount !== undefined) record.amount = newAmount;
 
    return await this.payReceiveRepo.save(record);
  }
 

  // ===========================================================================
  // DEPOSIT CHAIN
  // ===========================================================================

  async teacherSubmit(id: string, dto: TeacherSubmitDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.DEPOSIT, 'teacher-submit');
    this.guardStatus(record, PayReceiveStatus.PENDING, 'teacher-submit');

    record.status = PayReceiveStatus.TEACHER_SUBMITTED;
    record.submitted_by = dto.submitted_by;
    record.submitted_at = new Date();
    record.can_edit = false;
    if (dto.note) record.note = dto.note;
    return await this.payReceiveRepo.save(record);
  }

  async adminReceiveDeposit(id: string, dto: AdminReceiveDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.DEPOSIT, 'admin-receive-deposit');
    this.guardStatus(record, PayReceiveStatus.TEACHER_SUBMITTED, 'admin-receive-deposit');

    record.status = PayReceiveStatus.ADMIN_RECEIVED;
    record.received_by = dto.received_by;
    record.received_at = new Date();
    record.can_edit = false;
    if (dto.note) record.note = dto.note;
    return await this.payReceiveRepo.save(record);
  }

  /**
   * Step 3: Admin confirms cash has physically arrived at the bank.
   * Setting bank_deposited_by unlocks this amount for withdrawal.
   */
  async confirmBankDeposit(id: string, dto: BankDepositDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.DEPOSIT, 'bank-deposit');
    this.guardStatus(record, PayReceiveStatus.ADMIN_RECEIVED, 'bank-deposit');

    record.status = PayReceiveStatus.BANK_DEPOSITED;
    record.bank_deposited_by = dto.bank_deposited_by;
    record.bank_deposited_at = new Date();
    record.bank_reference = dto.bank_reference ?? null;
    record.bank_deposited_papers = dto.bank_deposited_paper
      ? [dto.bank_deposited_paper]
      : (record.bank_deposited_papers ?? []);
    record.can_edit = false;
    if (dto.note) record.note = dto.note;
    return await this.payReceiveRepo.save(record);
  }

  async superAdminConfirmDeposit(id: string, dto: SuperAdminConfirmDepositDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.DEPOSIT, 'super-admin-confirm-deposit');
    this.guardStatus(record, PayReceiveStatus.BANK_DEPOSITED, 'super-admin-confirm-deposit');

    record.status = PayReceiveStatus.SUPER_ADMIN_CONFIRMED;
    record.super_admin_confirmed_by = dto.super_admin_confirmed_by;
    record.super_admin_confirmed_at = new Date();
    record.can_edit = false;
    if (dto.note) record.note = dto.note;
    return await this.payReceiveRepo.save(record);
  }

  // ===========================================================================
  // WITHDRAWAL CHAIN
  // ===========================================================================

  async adminConfirmWithdrawal(id: string, dto: AdminConfirmWithdrawalDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.WITHDRAWAL, 'admin-confirm-withdrawal');
    this.guardStatus(record, PayReceiveStatus.PENDING, 'admin-confirm-withdrawal');

    record.status = PayReceiveStatus.ADMIN_CONFIRMED;
    record.admin_confirmed_by = dto.admin_confirmed_by;
    record.admin_confirmed_at = new Date();
    record.can_edit = false;
    if (dto.note) record.note = dto.note;
    return await this.payReceiveRepo.save(record);
  }

  async superAdminApproveWithdrawal(id: string, dto: SuperAdminApproveWithdrawalDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.WITHDRAWAL, 'super-admin-approve-withdrawal');
    this.guardStatus(record, PayReceiveStatus.ADMIN_CONFIRMED, 'super-admin-approve-withdrawal');

    record.status = PayReceiveStatus.SUPER_ADMIN_APPROVED;
    record.super_admin_approved_by = dto.super_admin_approved_by;
    record.super_admin_approved_at = new Date();
    record.can_edit = false;
    if (dto.note) record.note = dto.note;
    return await this.payReceiveRepo.save(record);
  }

  /**
   * Super admin fully rejects a withdrawal — deletes the linked saving row,
   * which triggers recalculate and restores the wallet automatically.
   *
   * STUDENT: savingsService.remove() → recalculateStudentBalances() ✅
   * CLASS:   savingsService.removeClassSaving() → recalculateClassBalance() ✅
   */
  async superAdminRejectWithdrawal(id: string, dto: SuperAdminRejectWithdrawalDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.WITHDRAWAL, 'super-admin-reject-withdrawal');
    this.guardStatus(record, PayReceiveStatus.ADMIN_CONFIRMED, 'super-admin-reject-withdrawal');

    const ownerType = record.saving?.owner_type;

    if (ownerType === SavingOwnerType.STUDENT) {
      // remove() soft-deletes and calls recalculateStudentBalances → wallet restored ✅
      await this.savingsService.remove(record.saving_id);
    } else if (ownerType === SavingOwnerType.CLASS) {
      // removeClassSaving() soft-deletes and calls recalculateClassBalance → wallet restored ✅
      await this.savingsService.removeClassSaving(record.saving_id);
    } else {
      throw new BadRequestException('Unknown saving owner_type on this record');
    }

    record.status = PayReceiveStatus.SUPER_ADMIN_REJECTED;
    record.super_admin_rejected_by = dto.super_admin_rejected_by;
    record.super_admin_rejected_at = new Date();
    record.rejection_reason = dto.rejection_reason ?? null;
    record.can_edit = false;
    return await this.payReceiveRepo.save(record);
  }

  /**
   * Admin rejects a CLASS withdrawal at admin_confirmed stage.
   * Status → ADMIN_REJECTED, can_edit → true.
   * Saving row is NOT deleted — wallet stays debited.
   * Wallet will be corrected automatically when teacher resubmits with a new amount
   * because recalculateClassBalance() rebuilds all balances from scratch.
   *
   * ✅ No wallet change needed here — wallet is adjusted on resubmit.
   */
  async adminRejectWithdrawal(id: string, dto: AdminRejectWithdrawalDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.WITHDRAWAL, 'admin-reject-withdrawal');
    this.guardStatus(record, PayReceiveStatus.ADMIN_CONFIRMED, 'admin-reject-withdrawal');

    if (record.saving?.owner_type !== SavingOwnerType.CLASS)
      throw new BadRequestException('Cannot "admin-reject-withdrawal": only CLASS savings can be rejected at this stage');

    record.status = PayReceiveStatus.ADMIN_REJECTED;
    record.rejected_by = dto.rejected_by;
    record.rejected_at = new Date();
    record.rejection_reason = dto.rejection_reason ?? null;
    record.can_edit = true;
    if (dto.note) record.note = dto.note;
    return await this.payReceiveRepo.save(record);
  }

  /**
   * Teacher edits and resubmits a CLASS withdrawal after ADMIN_REJECTED.
   *
   * Wallet behaviour:
   *   - If amount DECREASES (e.g. 100 → 80): saving row amount updated,
   *     recalculateClassBalance() rebuilds history → wallet gains back 20.
   *   - If amount INCREASES (e.g. 100 → 120): same recalculate → wallet loses 20 more.
   *   - If amount unchanged: recalculate runs but produces same result.
   *
   * ✅ FIX: update saving.amount then recalculateClassBalance() so wallet reflects new amount.
   */
  async teacherResubmitWithdrawal(id: string, dto: TeacherResubmitDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.WITHDRAWAL, 'teacher-resubmit-withdrawal');
    this.guardStatus(record, PayReceiveStatus.ADMIN_REJECTED, 'teacher-resubmit-withdrawal');
    this.guardCanEdit(record, 'teacher-resubmit-withdrawal');

    const oldAmount = Number(record.amount);
    const newAmount = dto.amount !== undefined ? Number(dto.amount) : oldAmount;
    const saving = record.saving;

    // ── Balance check ──────────────────────────────────────────────────────────
    // Add back the old debit so we check against the balance as if this
    // withdrawal didn't exist yet, then see if the new amount fits.
    if (dto.amount !== undefined && dto.amount !== oldAmount) {
      if (saving?.owner_type === SavingOwnerType.CLASS && saving.class_id) {
        // class wallet already has the old debit baked in; add it back to get "available before this tx"
        const walletBeforeThis = (await this.savingsService.getClassBalance(saving.class_id)).current_balance + oldAmount;
        if (newAmount > walletBeforeThis) {
          throw new BadRequestException(
            `Insufficient class balance on resubmit. ` +
            `Requested: ${newAmount}, Available: ${walletBeforeThis}`,
          );
        }
      } else if (saving?.owner_type === SavingOwnerType.STUDENT && saving.student_id) {
        const { current_balance } = await this.savingsService.getStudentBalance(saving.student_id);
        const walletBeforeThis = current_balance + oldAmount;
        if (newAmount > walletBeforeThis) {
          throw new BadRequestException(
            `Insufficient student balance on resubmit. ` +
            `Requested: ${newAmount}, Available: ${walletBeforeThis}`,
          );
        }
      }
    }

    // ── Update saving row amount + recalculate wallet ──────────────────────────
    // savingsService.updateSavingAmount() updates saving.amount then calls
    // recalculateStudentBalances() or recalculateClassBalance() as appropriate,
    // so the wallet reflects the corrected figure before we return.
    if (dto.amount !== undefined && dto.amount !== oldAmount) {
      await this.savingsService.updateSavingAmount(record.saving_id, newAmount);
    }

    // ── Sync pay-receive amount to match saving ────────────────────────────────
    if (dto.amount !== undefined) record.amount = newAmount;
    if (dto.note !== undefined) record.note = dto.note;

    record.status = PayReceiveStatus.PENDING;
    record.can_edit = false;
    record.rejected_by = null;
    record.rejected_at = null;
    record.rejection_reason = null;
    record.submitted_by = dto.submitted_by;
    record.submitted_at = new Date();
    return await this.payReceiveRepo.save(record);
  }

  /**
   * CEO rejects a CLASS withdrawal at admin_confirmed stage (terminal).
   * Saving row is NOT deleted — the saving record stays for audit.
   * Because the saving row stays, the debit stays too.
   *
   * ✅ FIX: soft-delete the saving and recalculate to restore the wallet,
   * same as superAdminRejectWithdrawal.
   */
  async superAdminRejectClassWithdrawal(id: string, dto: SuperAdminRejectClassWithdrawalDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.WITHDRAWAL, 'super-admin-reject-class-withdrawal');

    if (record.status === PayReceiveStatus.ADMIN_REJECTED)
      throw new BadRequestException(
        'Cannot reject: admin has already rejected this withdrawal (status = admin_rejected). CEO is not involved after admin rejection.',
      );

    this.guardStatus(record, PayReceiveStatus.ADMIN_CONFIRMED, 'super-admin-reject-class-withdrawal');

    if (record.saving?.owner_type !== SavingOwnerType.CLASS)
      throw new BadRequestException('Cannot "super-admin-reject-class-withdrawal": only CLASS savings use this endpoint.');

    // ✅ FIX: delete saving and recalculate so class wallet is restored
    await this.savingsService.removeClassSaving(record.saving_id);

    record.status = PayReceiveStatus.REJECTED;
    record.rejected_by = dto.rejected_by;
    record.rejected_at = new Date();
    record.rejection_reason = dto.rejection_reason ?? null;
    record.can_edit = false;
    if (dto.note) record.note = dto.note;
    return await this.payReceiveRepo.save(record);
  }

  /**
   * Parent collects cash for a STUDENT saving withdrawal. Terminal ✓
   */
  async parentReceive(id: string, dto: ParentReceiveDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.WITHDRAWAL, 'parent-receive');
    this.guardStatus(record, PayReceiveStatus.SUPER_ADMIN_APPROVED, 'parent-receive');

    if (record.saving?.owner_type !== SavingOwnerType.STUDENT)
      throw new BadRequestException('Cannot "parent-receive": this saving belongs to a CLASS, use teacher-receive instead');

    record.status = PayReceiveStatus.PARENT_RECEIVED;
    record.parent_received_by = dto.parent_received_by;
    record.parent_received_at = new Date();
    record.can_edit = false;
    if (dto.note) record.note = dto.note;
    return await this.payReceiveRepo.save(record);
  }

  /**
   * Teacher collects cash for a CLASS saving withdrawal. Terminal ✓
   */
  async teacherReceive(id: string, dto: TeacherReceiveDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.WITHDRAWAL, 'teacher-receive');
    this.guardStatus(record, PayReceiveStatus.SUPER_ADMIN_APPROVED, 'teacher-receive');

    if (record.saving?.owner_type !== SavingOwnerType.CLASS)
      throw new BadRequestException('Cannot "teacher-receive": this saving belongs to a STUDENT, use parent-receive instead');

    record.status = PayReceiveStatus.TEACHER_RECEIVED;
    record.teacher_received_by = dto.teacher_received_by;
    record.teacher_received_at = new Date();
    record.can_edit = false;
    if (dto.note) record.note = dto.note;
    return await this.payReceiveRepo.save(record);
  }

  // ===========================================================================
  // REJECT (deposit chain)
  // ===========================================================================

  /**
   * Admin rejects a non-terminal deposit record.
   * Deposit money never arrived → wallet is unchanged (correct, no money was credited).
   * Status → REJECTED, can_edit → false.
   */
  async reject(id: string, dto: RejectDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);

    const TERMINAL: PayReceiveStatus[] = [
      PayReceiveStatus.SUPER_ADMIN_CONFIRMED,
      PayReceiveStatus.PARENT_RECEIVED,
      PayReceiveStatus.TEACHER_RECEIVED,
      PayReceiveStatus.SUPER_ADMIN_REJECTED,
      PayReceiveStatus.REJECTED,
    ];
    if (TERMINAL.includes(record.status))
      throw new BadRequestException(`Cannot reject: already in terminal status "${record.status}"`);

    record.status = PayReceiveStatus.REJECTED;
    record.rejected_by = dto.rejected_by;
    record.rejected_at = new Date();
    record.rejection_reason = dto.rejection_reason ?? null;
    record.can_edit = false;
    return await this.payReceiveRepo.save(record);
  }

  // ===========================================================================
  // UNLOCK FOR EDIT (super admin gate — deposit chain only)
  // ===========================================================================

  async unlockForEdit(id: string, dto: UnlockForEditDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardStatus(record, PayReceiveStatus.REJECTED, 'unlock-for-edit');

    if (record.can_edit)
      throw new BadRequestException('Record is already unlocked for editing (can_edit = true)');

    record.can_edit = true;
    record.note = record.note
      ? `${record.note} | Unlocked by ${dto.unlocked_by}`
      : `Unlocked for edit by ${dto.unlocked_by}`;
    return await this.payReceiveRepo.save(record);
  }

  // ===========================================================================
  // TEACHER RE-SUBMIT (deposit chain — after REJECTED + can_edit = true)
  // ===========================================================================

  /**
   * Teacher resubmits a REJECTED deposit after super admin unlocks it.
   *
   * When the teacher changes the amount:
   *   1. saving.amount is updated via savingsService.updateSavingAmount()
   *   2. recalculate rebuilds opening/closing balances and writes the new
   *      figure back to student.saving_wallet or class.saving_wallet
   *   3. pay_receive.amount is synced to match
   *
   * Deposit wallet logic:
   *   DEPOSIT → wallet was credited when the saving row was first created.
   *   If the teacher now changes 100 kip → 80 kip, the wallet must DROP by 20.
   *   If they change 100 → 120, the wallet GAINS 20.
   *   recalculateStudentBalances / recalculateClassBalance replays all rows
   *   so the wallet is always exactly correct.
   *
   * Status → PENDING, can_edit → false, rejection fields cleared.
   */
  async teacherResubmit(id: string, dto: TeacherResubmitDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.DEPOSIT, 'teacher-resubmit');
    this.guardStatus(record, PayReceiveStatus.REJECTED, 'teacher-resubmit');
    this.guardCanEdit(record, 'teacher-resubmit');

    const oldAmount = Number(record.amount);
    const newAmount = dto.amount !== undefined ? Number(dto.amount) : oldAmount;

    // ── Update saving row + recalculate wallet when amount changed ─────────────
    if (dto.amount !== undefined && newAmount !== oldAmount) {
      // updateSavingAmount() saves the new amount on the saving row then calls
      // recalculateStudentBalances() or recalculateClassBalance() automatically,
      // so student.saving_wallet / class.saving_wallet is correct before we return.
      await this.savingsService.updateSavingAmount(record.saving_id, newAmount);
    }

    // ── Sync pay-receive fields ────────────────────────────────────────────────
    if (dto.amount !== undefined) record.amount = newAmount;
    if (dto.note !== undefined) record.note = dto.note;

    record.status = PayReceiveStatus.PENDING;
    record.can_edit = false;
    record.rejected_by = null;
    record.rejected_at = null;
    record.rejection_reason = null;
    record.submitted_by = dto.submitted_by;
    record.submitted_at = new Date();
    return await this.payReceiveRepo.save(record);
  }

  // ===========================================================================
  // SOFT DELETE (PENDING only)
  // ===========================================================================

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardStatus(record, PayReceiveStatus.PENDING, 'delete');
    record.is_deleted = true;
    await this.payReceiveRepo.save(record);
    return { message: `PayReceive "${id}" deleted successfully` };
  }
}
