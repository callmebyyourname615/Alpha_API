import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  BankDepositBatch,
  BankDepositBatchStatus,
} from './bank-deposit-batch.entity';
import {
  PayReceive,
  PayReceiveStatus,
} from '../pay_receivce/pay-receive.entity';
import { SavingsService } from '../savings/savings.service';
import { SavingOwnerType } from '../savings/savings.entity';

@Injectable()
export class BankDepositBatchService {
  constructor(
    @InjectRepository(BankDepositBatch)
    private readonly batchRepo: Repository<BankDepositBatch>,

    @InjectRepository(PayReceive)
    private readonly payReceiveRepo: Repository<PayReceive>,

    // ✅ Injected so confirmBatch / rejectBatch can trigger wallet recalculation
    private readonly savingsService: SavingsService,
  ) {}

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private guardBatchCanEdit(batch: BankDepositBatch, action: string): void {
    if (!batch.can_edit)
      throw new BadRequestException(`Cannot "${action}": super admin has not enabled editing on this batch (can_edit = false)`);
  }

  /**
   * Collect unique student/class IDs from a set of pay-receive records
   * and trigger the appropriate recalculate so wallets stay in sync.
   */
  private async recalculateWalletsForRecords(records: PayReceive[]): Promise<void> {
    const studentIds = new Set<string>();
    const classIds = new Set<string>();

    for (const rec of records) {
      const ownerType = rec.saving?.owner_type;
      if (ownerType === SavingOwnerType.STUDENT && rec.saving?.student_id)
        studentIds.add(rec.saving.student_id);
      else if (ownerType === SavingOwnerType.CLASS && rec.saving?.class_id)
        classIds.add(rec.saving.class_id);
    }

    await Promise.all([
      ...[...studentIds].map((id) => this.savingsService.recalculateStudentBalances(id)),
      ...[...classIds].map((id) => this.savingsService.recalculateClassBalance(id)),
    ]);
  }

  // ===========================================================================
  // CREATE BATCH
  // ===========================================================================

  /**
   * Admin groups multiple ADMIN_RECEIVED transactions into one batch
   * and uploads one bank deposit paper for all of them.
   * Status of each PayReceive → BANK_DEPOSITED (bank_deposited_by set).
   *
   * Note: wallet credit happens at the pay-receive layer only when
   * bank_deposited_by IS NOT NULL AND a withdrawal is requested.
   * The savings wallet is NOT changed here — saving rows for deposits
   * were already written (and credited) when the saving was created.
   */
  async createBatch(dto: {
    depositedBy: string;
    payReceiveIds: string[];
    bankReference?: string;
    note?: string;
    bankDepositedPaper?: string;
  }): Promise<BankDepositBatch> {
    if (!dto.payReceiveIds.length)
      throw new BadRequestException('payReceiveIds must not be empty');

    const records = await this.payReceiveRepo.find({
      where: { id: In(dto.payReceiveIds), is_deleted: false },
      relations: ['saving'],
    });

    if (records.length !== dto.payReceiveIds.length)
      throw new BadRequestException('One or more payReceiveIds not found');

    for (const rec of records) {
      if (rec.status !== PayReceiveStatus.ADMIN_RECEIVED)
        throw new BadRequestException(
          `PayReceive ${rec.id} must be status=admin_received to batch (current: ${rec.status})`,
        );

      const existingPapers = rec.bank_deposited_papers ?? [];
      const incomingPaper = dto.bankDepositedPaper ? [dto.bankDepositedPaper] : [];
      const allPapers = [...existingPapers, ...incomingPaper];
      if (!allPapers.length)
        throw new BadRequestException(
          `PayReceive ${rec.id} must have at least one bank deposit paper before batching`,
        );
    }

    const totalAmount = records.reduce((sum, r) => sum + Number(r.amount), 0);
    const batchPapers = dto.bankDepositedPaper ? [dto.bankDepositedPaper] : [];

    const batch = await this.batchRepo.save(
      this.batchRepo.create({
        depositedBy: dto.depositedBy,
        bankReference: dto.bankReference ?? null,
        bankDepositedPapers: batchPapers,
        note: dto.note ?? null,
        totalAmount,
        depositedAt: new Date(),
        status: BankDepositBatchStatus.PENDING,
        can_edit: false,
        payReceiveIds: dto.payReceiveIds,
      }),
    );

    for (const rec of records) {
      rec.bank_deposited_papers = [
        ...(rec.bank_deposited_papers ?? []),
        ...(dto.bankDepositedPaper ? [dto.bankDepositedPaper] : []),
      ];
      rec.depositBatchId = batch.id;
      rec.status = PayReceiveStatus.BANK_DEPOSITED;
      rec.bank_deposited_by = dto.depositedBy;
      rec.bank_deposited_at = new Date();
      rec.bank_reference = dto.bankReference ?? null;
      rec.can_edit = false;
    }
    await this.payReceiveRepo.save(records);

    return this.findOne(batch.id);
  }

  // ===========================================================================
  // CONFIRM BATCH
  // ===========================================================================

  /**
   * CEO confirms the whole batch after verifying the bank statement.
   * Advances all linked PayReceives to SUPER_ADMIN_CONFIRMED.
   *
   * No wallet change needed: deposits were already credited to saving_wallet
   * when the saving rows were created. Confirming here is an audit/approval step.
   */
  async confirmBatch(batchId: string, superAdminId: string, note?: string): Promise<BankDepositBatch> {
    const batch = await this.findOne(batchId);

    if (batch.status !== BankDepositBatchStatus.PENDING)
      throw new BadRequestException(`Batch cannot be confirmed: status is "${batch.status}"`);

    batch.status = BankDepositBatchStatus.SUPER_ADMIN_CONFIRMED;
    batch.superAdminConfirmedBy = superAdminId;
    batch.superAdminConfirmedAt = new Date();
    batch.can_edit = false;
    if (note) batch.note = note;
    await this.batchRepo.save(batch);

    const records = await this.payReceiveRepo.find({
      where: { depositBatchId: batchId },
      relations: ['saving'],
    });

    for (const rec of records) {
      rec.status = PayReceiveStatus.SUPER_ADMIN_CONFIRMED;
      rec.super_admin_confirmed_by = superAdminId;
      rec.super_admin_confirmed_at = new Date();
      rec.can_edit = false;
    }
    await this.payReceiveRepo.save(records);

    return this.findOne(batchId);
  }

  // ===========================================================================
  // REJECT BATCH
  // ===========================================================================

  /**
   * CEO rejects the batch (e.g. deposit paper totals don't match).
   *
   * Effects:
   *   - batch.status → REJECTED, can_edit → false
   *   - every linked PayReceive: status → ADMIN_RECEIVED, depositBatchId cleared,
   *     bank_deposited_* fields nulled, can_edit → false
   *
   * Wallet impact: bank_deposited_by is being cleared back to null,
   * so these deposits become "locked" again and are no longer counted
   * toward getAvailableBalance(). No explicit wallet recalculate needed
   * because saving_wallet (ledger) was already credited when the saving was
   * created — the batch reject only affects the pay-receive layer.
   */
  async rejectBatch(
    batchId: string,
    superAdminId: string,
    rejectionReason?: string,
    note?: string,
  ): Promise<BankDepositBatch> {
    const batch = await this.findOne(batchId);

    if (batch.status !== BankDepositBatchStatus.PENDING)
      throw new BadRequestException(`Batch cannot be rejected: status is "${batch.status}"`);

    batch.status = BankDepositBatchStatus.REJECTED;
    batch.superAdminRejectedBy = superAdminId;
    batch.superAdminRejectedAt = new Date();
    batch.rejectionReason = rejectionReason ?? null;
    batch.can_edit = false;
    if (note) batch.note = note;
    await this.batchRepo.save(batch);

    const records = await this.payReceiveRepo.find({
      where: { depositBatchId: batchId },
      relations: ['saving'],
    });

    for (const rec of records) {
      rec.status = PayReceiveStatus.ADMIN_RECEIVED;
      rec.depositBatchId = null;
      rec.bank_deposited_by = null;
      rec.bank_deposited_at = null;
      rec.bank_reference = null;
      // keep existing papers — admin will ADD more, not replace
      rec.can_edit = false;
    }
    await this.payReceiveRepo.save(records);

    return this.findOne(batchId);
  }

  // ===========================================================================
  // UNLOCK BATCH FOR EDIT
  // ===========================================================================

  /**
   * After rejecting a batch, CEO must explicitly unlock it
   * before admin can re-check the deposit paper and re-batch.
   * Only valid when batch.status = REJECTED.
   */
  async unlockBatchForEdit(batchId: string, unlockedBy: string): Promise<BankDepositBatch> {
    const batch = await this.findOne(batchId);

    if (batch.status !== BankDepositBatchStatus.REJECTED)
      throw new BadRequestException(`Batch cannot be unlocked: status is "${batch.status}", expected "rejected"`);
    if (batch.can_edit)
      throw new BadRequestException('Batch is already unlocked for editing');

    batch.can_edit = true;
    batch.note = batch.note
      ? `${batch.note} | Unlocked by ${unlockedBy}`
      : `Unlocked for edit by ${unlockedBy}`;
    await this.batchRepo.save(batch);

    if (batch.payReceiveIds?.length) {
      const records = await this.payReceiveRepo.find({
        where: { id: In(batch.payReceiveIds), status: PayReceiveStatus.ADMIN_RECEIVED },
      });
      for (const rec of records) rec.can_edit = true;
      await this.payReceiveRepo.save(records);
    }

    return this.findOne(batchId);
  }

  // ===========================================================================
  // ADMIN UPDATE AFTER BATCH REJECT
  // ===========================================================================

  /**
   * Admin re-checks deposit paper and corrects amount or paper file
   * after a batch rejection + unlock.
   *
   * Guards: status = ADMIN_RECEIVED, can_edit = true.
   *
   * ✅ If admin changes amount, recalculate the wallet so saving_wallet
   * reflects the corrected figure before a new batch is created.
   */
  async adminUpdatePayReceiveAfterBatchReject(
    payReceiveId: string,
    dto: {
      updatedBy: string;
      amount?: number;
      note?: string;
      bankDepositedPaper?: string;
      bankReference?: string;
    },
  ): Promise<PayReceive> {
    const record = await this.payReceiveRepo.findOne({
      where: { id: payReceiveId, is_deleted: false },
      relations: ['saving'],
    });
    if (!record) throw new NotFoundException(`PayReceive "${payReceiveId}" not found`);

    if (record.status !== PayReceiveStatus.ADMIN_RECEIVED)
      throw new BadRequestException(`Cannot update: PayReceive status is "${record.status}", expected "admin_received"`);
    if (!record.can_edit)
      throw new BadRequestException(
        `Cannot update PayReceive "${payReceiveId}": super admin must call /unlock on the rejected batch first (can_edit = false)`,
      );

    if (dto.amount !== undefined) {
      // ✅ Use the proper service method — updates saving.amount and recalculates
      // the wallet (student or class) in one call. No private-property hacks.
      await this.savingsService.updateSavingAmount(record.saving_id, dto.amount);
      record.amount = dto.amount;
    }

    if (dto.note !== undefined) record.note = dto.note;
    if (dto.bankReference !== undefined) record.bank_reference = dto.bankReference;
    if (dto.bankDepositedPaper) {
      record.bank_deposited_papers = [
        ...(record.bank_deposited_papers ?? []),
        dto.bankDepositedPaper,
      ];
    }

    return this.payReceiveRepo.save(record);
  }

  // ===========================================================================
  // FIND
  // ===========================================================================

  async findOne(id: string): Promise<BankDepositBatch> {
    const batch = await this.batchRepo.findOne({
      where: { id },
      relations: ['depositor', 'payReceives', 'payReceives.saving'],
    });
    if (!batch) throw new NotFoundException(`Batch ${id} not found`);
    return batch;
  }

  async findAll(): Promise<BankDepositBatch[]> {
    return this.batchRepo.find({
      relations: ['depositor', 'payReceives'],
      order: { createdAt: 'DESC' },
    });
  }

  // ===========================================================================
  // MONTHLY SUMMARY
  // ===========================================================================

  async getMonthlySummary(year: number, month: number) {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 1);

    const batches = await this.batchRepo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.payReceives', 'pr')
      .leftJoinAndSelect('pr.saving', 'saving')
      .where('batch.createdAt >= :from', { from })
      .andWhere('batch.createdAt < :to', { to })
      .orderBy('batch.createdAt', 'ASC')
      .getMany();

    const totalDeposited = batches.reduce((s, b) => s + Number(b.totalAmount), 0);
    const confirmed = batches.filter((b) => b.status === BankDepositBatchStatus.SUPER_ADMIN_CONFIRMED);
    const pending = batches.filter((b) => b.status === BankDepositBatchStatus.PENDING);
    const rejected = batches.filter((b) => b.status === BankDepositBatchStatus.REJECTED);

    return {
      year,
      month,
      total_batches: batches.length,
      confirmed_batches: confirmed.length,
      pending_batches: pending.length,
      rejected_batches: rejected.length,
      total_deposited: totalDeposited,
      confirmed_amount: confirmed.reduce((s, b) => s + Number(b.totalAmount), 0),
      pending_amount: pending.reduce((s, b) => s + Number(b.totalAmount), 0),
      rejected_amount: rejected.reduce((s, b) => s + Number(b.totalAmount), 0),
      batches,
    };
  }
}