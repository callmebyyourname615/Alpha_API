import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BankDepositBatchService } from './bank-deposit-batch.service';

// ─── File interceptor (reused for both create and admin-update) ───────────────

const depositPaperInterceptor = FileInterceptor('bank_deposited_paper', {
  storage: diskStorage({
    destination: './uploads/bank-deposit-papers',
    filename: (_req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new BadRequestException(`File type ${ext} not allowed`), false);
    }
    cb(null, true);
  },
});

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('bank-deposit-batches')
export class BankDepositBatchController {
  constructor(private readonly batchService: BankDepositBatchService) {}

  // ─── CREATE ─────────────────────────────────────────────────────────────────

  /**
   * POST /bank-deposit-batches
   * Admin groups admin_received transactions + uploads one deposit paper.
   *
   * Body (multipart/form-data):
   *   depositedBy      UUID
   *   payReceiveIds    string | string[]   (one or more UUIDs)
   *   bankReference?   string
   *   note?            string
   *   bank_deposited_paper?  file (PDF/PNG/JPG, max 10MB)
   */
  @Post()
  @UseInterceptors(depositPaperInterceptor)
  async createBatch(
    @Body()
    body: {
      depositedBy: string;
      payReceiveIds: string | string[];
      bankReference?: string;
      note?: string;
    },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const ids = Array.isArray(body.payReceiveIds)
      ? body.payReceiveIds
      : [body.payReceiveIds];

    const bankDepositedPaper = file
      ? `${file.originalname}|uploads/bank-deposit-papers/${file.filename}`
      : undefined;

    return this.batchService.createBatch({
      depositedBy: body.depositedBy,
      payReceiveIds: ids,
      bankReference: body.bankReference,
      note: body.note,
      bankDepositedPaper, // still single paper per batch action — appended inside service
    });
  }

  // ─── FIND ALL ───────────────────────────────────────────────────────────────

  @Get()
  findAll() {
    return this.batchService.findAll();
  }

  /**
   * GET /bank-deposit-batches/monthly-summary?year=2025&month=5
   * CEO monthly review — now also includes rejected batch counts/amounts.
   */
  @Get('monthly-summary')
  getMonthlySummary(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.batchService.getMonthlySummary(Number(year), Number(month));
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.batchService.findOne(id);
  }

  // ─── CONFIRM ────────────────────────────────────────────────────────────────

  /**
   * PATCH /bank-deposit-batches/:id/confirm
   * CEO confirms a PENDING batch after verifying the bank statement.
   * Advances all linked PayReceives to super_admin_confirmed.
   *
   * Body: { superAdminId: UUID, note?: string }
   */
  @Patch(':id/confirm')
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { superAdminId: string; note?: string },
  ) {
    return this.batchService.confirmBatch(id, body.superAdminId, body.note);
  }

  // ─── REJECT ─────────────────────────────────────────────────────────────────

  /**
   * PATCH /bank-deposit-batches/:id/reject
   * CEO/super admin rejects a PENDING batch (paper totals don't match, etc.).
   *
   * Effects:
   *   - batch.status → REJECTED, can_edit → false
   *   - all linked PayReceives → ADMIN_RECEIVED, detached from batch, can_edit → false
   *
   * Admin must wait for /unlock before re-batching.
   *
   * Body: { superAdminId: UUID, rejectionReason?: string, note?: string }
   */
  @Patch(':id/reject')
  rejectBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      superAdminId: string;
      rejectionReason?: string;
      note?: string;
    },
  ) {
    return this.batchService.rejectBatch(
      id,
      body.superAdminId,
      body.rejectionReason,
      body.note,
    );
  }

  // ─── UNLOCK FOR EDIT ────────────────────────────────────────────────────────

  /**
   * PATCH /bank-deposit-batches/:id/unlock
   * CEO/super admin enables editing on a REJECTED batch so admin can
   * re-check the deposit paper, update amounts, and create a new batch.
   *
   * Effects:
   *   - batch.can_edit → true
   *   - linked ADMIN_RECEIVED PayReceives.can_edit → true
   *
   * Only valid when batch.status = REJECTED.
   *
   * Body: { unlockedBy: UUID }
   */
  @Patch(':id/unlock')
  unlockBatchForEdit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { unlockedBy: string },
  ) {
    return this.batchService.unlockBatchForEdit(id, body.unlockedBy);
  }

  // ─── ADMIN UPDATE INDIVIDUAL RECORD (after batch reject + unlock) ────────────

  /**
   * PATCH /bank-deposit-batches/:batchId/pay-receive/:payReceiveId
   * Admin corrects an individual PayReceive (amount, note, deposit paper)
   * after a batch has been rejected and unlocked.
   *
   * Guards:
   *   - PayReceive.status must be ADMIN_RECEIVED
   *   - PayReceive.can_edit must be true
   *
   * Body (multipart/form-data):
   *   updatedBy             UUID
   *   amount?               number
   *   note?                 string
   *   bankReference?        string
   *   bank_deposited_paper? file (optional, replaces existing)
   */
  @Patch(':batchId/pay-receive/:payReceiveId')
  @UseInterceptors(depositPaperInterceptor)
  async adminUpdatePayReceive(
    @Param('batchId', ParseUUIDPipe) _batchId: string,
    @Param('payReceiveId', ParseUUIDPipe) payReceiveId: string,
    @Body()
    body: {
      updatedBy: string;
      amount?: string; // multipart sends numbers as strings
      note?: string;
      bankReference?: string;
    },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const bankDepositedPaper = file
      ? `${file.originalname}|uploads/bank-deposit-papers/${file.filename}`
      : undefined;

    return this.batchService.adminUpdatePayReceiveAfterBatchReject(
      payReceiveId,
      {
        updatedBy: body.updatedBy,
        amount: body.amount !== undefined ? Number(body.amount) : undefined,
        note: body.note,
        bankReference: body.bankReference,
        bankDepositedPaper, // appended inside service, not replaced
      },
    );
  }
}
