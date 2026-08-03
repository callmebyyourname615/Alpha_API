import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  IsPositive,
} from 'class-validator';

// ─── CREATE DEPOSIT ───────────────────────────────────────────────────────────

export class CreatePayReceiveDto {
  @IsUUID()
  saving_id: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  initiated_by?: string;
}

// ─── CREATE WITHDRAWAL ────────────────────────────────────────────────────────
// Same shape as CreatePayReceiveDto — separated so Swagger/docs stay clean
// and the service can enforce the balance check on this path only.

export class CreateWithdrawalDto {
  @IsUUID()
  saving_id: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  initiated_by?: string;
}

// ─── UPDATE (PENDING only) ────────────────────────────────────────────────────

export class UpdatePayReceiveDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

// ─── DEPOSIT CHAIN ────────────────────────────────────────────────────────────

export class TeacherSubmitDto {
  @IsUUID()
  submitted_by: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminReceiveDto {
  @IsUUID()
  received_by: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class BankDepositDto {
  // Required — who performed the bank deposit
  @IsUUID()
  bank_deposited_by: string;

  @IsOptional()
  @IsString()
  bank_reference?: string;

  // Populated by the controller after multer processes the uploaded file;
  // clients should NOT send this field directly.
  @IsOptional()
  @IsString()
  bank_deposited_paper?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SuperAdminConfirmDepositDto {
  @IsUUID()
  super_admin_confirmed_by: string;

  @IsOptional()
  @IsString()
  note?: string;
}

// ─── WITHDRAWAL CHAIN ─────────────────────────────────────────────────────────

export class AdminConfirmWithdrawalDto {
  @IsUUID()
  admin_confirmed_by: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SuperAdminApproveWithdrawalDto {
  @IsUUID()
  super_admin_approved_by: string;

  @IsOptional()
  @IsString()
  note?: string;
}

// Super admin fully rejects a withdrawal (saving reversed).
export class SuperAdminRejectWithdrawalDto {
  @IsUUID()
  super_admin_rejected_by: string;

  @IsOptional()
  @IsString()
  rejection_reason?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ParentReceiveDto {
  @IsUUID()
  parent_received_by: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class TeacherReceiveDto {
  @IsUUID()
  teacher_received_by: string;

  @IsOptional()
  @IsString()
  note?: string;
}

// ─── SHARED REJECT ────────────────────────────────────────────────────────────

export class RejectDto {
  @IsUUID()
  rejected_by: string;

  @IsOptional()
  @IsString()
  rejection_reason?: string;
}

// ─── WITHDRAWAL REJECTION — ADMIN ─────────────────────────────────────────────
// Admin rejects CLASS withdrawal at admin_confirmed stage.
// Status → ADMIN_REJECTED, can_edit → true (teacher edits immediately, no unlock needed).

export class AdminRejectWithdrawalDto {
  @IsUUID()
  rejected_by: string;

  @IsOptional()
  @IsString()
  rejection_reason?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

// ─── WITHDRAWAL REJECTION — CEO ───────────────────────────────────────────────
// CEO rejects CLASS withdrawal at admin_confirmed stage,
// only when admin has NOT yet rejected it.
// Status → REJECTED, can_edit → false (terminal; teacher must create new transaction).

export class SuperAdminRejectClassWithdrawalDto {
  @IsUUID()
  rejected_by: string;

  @IsOptional()
  @IsString()
  rejection_reason?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

// ─── UNLOCK FOR EDIT ──────────────────────────────────────────────────────────
// Super admin enables can_edit on a REJECTED record.
// Not needed for ADMIN_REJECTED — teacher can edit immediately.

export class UnlockForEditDto {
  @IsUUID()
  unlocked_by: string;
}

// ─── TEACHER RE-SUBMIT ────────────────────────────────────────────────────────
// Used for both deposit resubmit (after REJECTED + can_edit = true)
// and withdrawal resubmit (after ADMIN_REJECTED + can_edit = true).

export class TeacherResubmitDto {
  @IsUUID()
  submitted_by: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsString()
  note?: string;
}