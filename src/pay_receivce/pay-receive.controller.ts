import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PayReceiveService } from './pay-receive.service';
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

// ─── File interceptor for bank deposit paper ─────────────────────────────────

export const bankDepositPaperInterceptor = FileInterceptor(
  'bank_deposited_paper',
  {
    storage: diskStorage({
      destination: './uploads/bank-deposit-papers',
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
      const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
      const ext = extname(file.originalname).toLowerCase();
      if (!allowed.includes(ext)) {
        return cb(
          new BadRequestException(
            `File type '${ext}' not allowed. Allowed: ${allowed.join(', ')}`,
          ),
          false,
        );
      }
      cb(null, true);
    },
  },
);

// ─── Controller ──────────────────────────────────────────────────────────────

@Controller('pay-receive')
export class PayReceiveController {
  constructor(private readonly payReceiveService: PayReceiveService) {}

  // ===========================================================================
  // CREATE
  // ===========================================================================

  /**
   * Create a new DEPOSIT record (status = pending).
   *
   * POST /pay-receive
   * Body: { saving_id, amount, note?, initiated_by? }
   */
  @Post()
  create(@Body() dto: CreatePayReceiveDto) {
    return this.payReceiveService.create(dto);
  }

  /**
   * Create a new WITHDRAWAL record.
   *
   * Validates available balance before saving — only deposits where
   * bank_deposited_by IS NOT NULL count toward withdrawable balance.
   * Deposits still in-transit to the bank are locked.
   *
   * POST /pay-receive/withdrawal
   * Body: { saving_id, amount, note?, initiated_by? }
   */
  @Post('withdrawal')
  createWithdrawal(@Body() dto: CreateWithdrawalDto) {
    return this.payReceiveService.createWithdrawal(dto);
  }

  // ===========================================================================
  // READ
  // ===========================================================================

  /**
   * GET /pay-receive
   * Returns all non-deleted records (deposits + withdrawals), newest first.
   */
  @Get()
  findAll() {
    return this.payReceiveService.findAll();
  }

  /**
   * GET /pay-receive/deposits
   * Returns all non-deleted deposit records.
   */
  @Get('deposits')
  findAllDeposits() {
    return this.payReceiveService.findAllDeposits();
  }

  /**
   * GET /pay-receive/withdrawals
   * Returns all non-deleted withdrawal records.
   */
  @Get('withdrawals')
  findAllWithdrawals() {
    return this.payReceiveService.findAllWithdrawals();
  }

  /**
   * Returns the amount that can currently be withdrawn from a saving wallet.
   *
   * Formula:  SUM(banked deposits) − SUM(active withdrawals)
   * Only deposits with bank_deposited_by IS NOT NULL are counted.
   *
   * Use this on the front-end to show the max allowed amount before
   * the user submits a withdrawal request.
   *
   * GET /pay-receive/available-balance/:savingId
   * Response: { savingId: string, availableBalance: number }
   */
  @Get('available-balance/student/:studentId')
  async getStudentAvailableBalance(
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.payReceiveService.getStudentAvailableBalanceBreakdown(studentId);
  }

  @Get('available-balance/:savingId')
  async getAvailableBalance(
    @Param('savingId', ParseUUIDPipe) savingId: string,
  ) {
    const availableBalance =
      await this.payReceiveService.getAvailableBalance(savingId);
    return { savingId, availableBalance };
  }

  /**
   * GET /pay-receive/by-saving/:savingId
   * Returns all non-deleted records linked to a saving.
   */
  @Get('by-saving/:savingId')
  findBySaving(@Param('savingId', ParseUUIDPipe) savingId: string) {
    return this.payReceiveService.findBySaving(savingId);
  }

  /**
   * GET /pay-receive/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.payReceiveService.findOne(id);
  }

  // ===========================================================================
  // UPDATE  (PENDING only)
  // ===========================================================================

  /**
   * PATCH /pay-receive/:id
   * Body: { amount?, note? }
   * Only allowed while status = pending.
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayReceiveDto,
  ) {
    return this.payReceiveService.update(id, dto);
  }

  // ===========================================================================
  // DEPOSIT CHAIN
  // ===========================================================================

  /**
   * DEPOSIT — Step 1: Teacher submits cash to admin.
   * pending → teacher_submitted
   *
   * PATCH /pay-receive/:id/teacher-submit
   * Body: { submitted_by: UUID, note? }
   */
  @Patch(':id/teacher-submit')
  teacherSubmit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TeacherSubmitDto,
  ) {
    return this.payReceiveService.teacherSubmit(id, dto);
  }

  /**
   * DEPOSIT — Step 2: Admin physically receives cash from teacher.
   * teacher_submitted → admin_received
   *
   * PATCH /pay-receive/:id/admin-receive-deposit
   * Body: { received_by: UUID, note? }
   */
  @Patch(':id/admin-receive-deposit')
  adminReceiveDeposit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminReceiveDto,
  ) {
    return this.payReceiveService.adminReceiveDeposit(id, dto);
  }

  /**
   * DEPOSIT — Step 3: Admin confirms cash has been deposited to the bank.
   * admin_received → bank_deposited
   *
   * After this step bank_deposited_by is set — the deposit amount becomes
   * available for withdrawal.
   *
   * PATCH /pay-receive/:id/bank-deposit
   * Request: multipart/form-data
   * Fields:  bank_deposited_by (UUID, required), bank_reference?, note?,
   *          bank_deposited_paper (file, optional — pdf/png/jpg/jpeg, max 10 MB)
   */
  @Patch(':id/bank-deposit')
  @UseInterceptors(bankDepositPaperInterceptor)
  async confirmBankDeposit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: BankDepositDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const bank_deposited_paper = file
      ? `${file.originalname}|uploads/bank-deposit-papers/${file.filename}`
      : undefined;

    return this.payReceiveService.confirmBankDeposit(id, {
      ...body,
      bank_deposited_paper,
    });
  }

  /**
   * DEPOSIT — Step 4: Super admin gives final confirmation.
   * bank_deposited → super_admin_confirmed  (terminal ✓)
   *
   * PATCH /pay-receive/:id/super-admin-confirm-deposit
   * Body: { super_admin_confirmed_by: UUID, note? }
   */
  @Patch(':id/super-admin-confirm-deposit')
  superAdminConfirmDeposit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuperAdminConfirmDepositDto,
  ) {
    return this.payReceiveService.superAdminConfirmDeposit(id, dto);
  }

  // ===========================================================================
  // WITHDRAWAL CHAIN
  // ===========================================================================

  /**
   * WITHDRAWAL — Step 1: Admin confirms the withdrawal request.
   * pending → admin_confirmed
   *
   * PATCH /pay-receive/:id/admin-confirm-withdrawal
   * Body: { admin_confirmed_by: UUID, note? }
   */
  @Patch(':id/admin-confirm-withdrawal')
  adminConfirmWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminConfirmWithdrawalDto,
  ) {
    return this.payReceiveService.adminConfirmWithdrawal(id, dto);
  }

  /**
   * WITHDRAWAL — Step 2a: Super admin approves (STUDENT or CLASS).
   * admin_confirmed → super_admin_approved
   *
   * PATCH /pay-receive/:id/super-admin-approve-withdrawal
   * Body: { super_admin_approved_by: UUID, note? }
   */
  @Patch(':id/super-admin-approve-withdrawal')
  superAdminApproveWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuperAdminApproveWithdrawalDto,
  ) {
    return this.payReceiveService.superAdminApproveWithdrawal(id, dto);
  }

  /**
   * WITHDRAWAL — Step 2b: Super admin fully rejects (saving reversed).
   * admin_confirmed → super_admin_rejected  (terminal ✗)
   * Deletes the linked saving record.
   *
   * PATCH /pay-receive/:id/super-admin-reject-withdrawal
   * Body: { super_admin_rejected_by: UUID, rejection_reason?, note? }
   */
  @Patch(':id/super-admin-reject-withdrawal')
  superAdminRejectWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuperAdminRejectWithdrawalDto,
  ) {
    return this.payReceiveService.superAdminRejectWithdrawal(id, dto);
  }

  /**
   * WITHDRAWAL — Admin rejects a CLASS withdrawal at admin_confirmed stage.
   * admin_confirmed → admin_rejected, can_edit → true
   * Teacher can edit and resubmit immediately (no unlock step required).
   *
   * PATCH /pay-receive/:id/admin-reject-withdrawal
   * Body: { rejected_by: UUID, rejection_reason?, note? }
   */
  @Patch(':id/admin-reject-withdrawal')
  adminRejectWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminRejectWithdrawalDto,
  ) {
    return this.payReceiveService.adminRejectWithdrawal(id, dto);
  }

  /**
   * WITHDRAWAL — Teacher edits and resubmits after ADMIN_REJECTED.
   * admin_rejected → pending  (re-enters the withdrawal chain)
   * Re-validates available balance in case the amount changed.
   *
   * PATCH /pay-receive/:id/resubmit-withdrawal
   * Body: { submitted_by: UUID, amount?, note? }
   */
  @Patch(':id/resubmit-withdrawal')
  teacherResubmitWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TeacherResubmitDto,
  ) {
    return this.payReceiveService.teacherResubmitWithdrawal(id, dto);
  }

  /**
   * WITHDRAWAL — CEO rejects a CLASS withdrawal at admin_confirmed stage.
   * Only valid when status = ADMIN_CONFIRMED (not after ADMIN_REJECTED).
   * admin_confirmed → rejected, can_edit → false  (terminal ✗)
   * Teacher must create a new withdrawal transaction.
   *
   * PATCH /pay-receive/:id/super-admin-reject-class-withdrawal
   * Body: { rejected_by: UUID, rejection_reason?, note? }
   */
  @Patch(':id/super-admin-reject-class-withdrawal')
  superAdminRejectClassWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuperAdminRejectClassWithdrawalDto,
  ) {
    return this.payReceiveService.superAdminRejectClassWithdrawal(id, dto);
  }

  /**
   * WITHDRAWAL — Step 3a: Parent collects cash (STUDENT savings only).
   * super_admin_approved → parent_received  (terminal ✓)
   *
   * PATCH /pay-receive/:id/parent-receive
   * Body: { parent_received_by: UUID, note? }
   */
  @Patch(':id/parent-receive')
  parentReceive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ParentReceiveDto,
  ) {
    return this.payReceiveService.parentReceive(id, dto);
  }

  /**
   * WITHDRAWAL — Step 3b: Teacher collects cash (CLASS savings only).
   * super_admin_approved → teacher_received  (terminal ✓)
   *
   * PATCH /pay-receive/:id/teacher-receive
   * Body: { teacher_received_by: UUID, note? }
   */
  @Patch(':id/teacher-receive')
  teacherReceive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TeacherReceiveDto,
  ) {
    return this.payReceiveService.teacherReceive(id, dto);
  }

  // ===========================================================================
  // REJECT  (deposit chain)
  // ===========================================================================

  /**
   * Admin rejects a non-terminal deposit record (typically teacher_submitted).
   * Status → REJECTED, can_edit → false.
   * Super admin must call /unlock-for-edit before teacher can resubmit.
   *
   * PATCH /pay-receive/:id/reject
   * Body: { rejected_by: UUID, rejection_reason? }
   */
  @Patch(':id/reject')
  reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectDto) {
    return this.payReceiveService.reject(id, dto);
  }

  // ===========================================================================
  // UNLOCK FOR EDIT  (super admin gate — deposit chain)
  // ===========================================================================

  /**
   * Super admin enables editing on a REJECTED deposit record.
   * Sets can_edit = true. Only valid when status = REJECTED.
   * Not needed for ADMIN_REJECTED — teacher edits immediately in that path.
   *
   * PATCH /pay-receive/:id/unlock-for-edit
   * Body: { unlocked_by: UUID }
   */
  @Patch(':id/unlock-for-edit')
  unlockForEdit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UnlockForEditDto,
  ) {
    return this.payReceiveService.unlockForEdit(id, dto);
  }

  // ===========================================================================
  // TEACHER RE-SUBMIT  (deposit chain — after REJECTED + can_edit = true)
  // ===========================================================================

  /**
   * Teacher edits the rejected DEPOSIT and resubmits it.
   * Guards: flow_type = DEPOSIT, status = REJECTED, can_edit = true.
   * After save: status → PENDING, can_edit → false, rejection fields cleared.
   *
   * PATCH /pay-receive/:id/resubmit
   * Body: { submitted_by: UUID, amount?, note? }
   */
  @Patch(':id/resubmit')
  teacherResubmit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TeacherResubmitDto,
  ) {
    return this.payReceiveService.teacherResubmit(id, dto);
  }

  // ===========================================================================
  // SOFT DELETE  (PENDING only)
  // ===========================================================================

  /**
   * DELETE /pay-receive/:id
   * Soft-deletes the record. Only allowed when status = pending.
   */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.payReceiveService.remove(id);
  }
}
