import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  IsNumber,
  IsPositive,
  Min,
  MaxLength,
} from 'class-validator';
import {
  ParasiteType,
  DrugForm,
  InjectionReaction,
  InjectionStatus,
} from '../parasite.injection.entity';

// =========================
// CREATE
// =========================

export class CreateParasiteInjectionDto {
  // ── Relations ──────────────────────────────────────────────────────────────
  @IsUUID()
  studentId: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsUUID()
  administeredById?: string;

  // ── Parasite / drug ────────────────────────────────────────────────────────
  @IsEnum(ParasiteType)
  parasite_type: ParasiteType;

  @IsString()
  @MaxLength(255)
  drug_name: string;

  @IsString()
  @MaxLength(100)
  dosage: string;

  @IsOptional()
  @IsEnum(DrugForm)
  drug_form?: DrugForm;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  batch_number?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  // ── Scheduling ─────────────────────────────────────────────────────────────
  @IsDateString()
  administered_date: string;

  @IsInt()
  @Min(1)
  round_number: number;

  @IsOptional()
  @IsDateString()
  next_due_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  treatment_program?: string;

  // ── Result ─────────────────────────────────────────────────────────────────
  @IsOptional()
  @IsEnum(InjectionReaction)
  reaction?: InjectionReaction;

  @IsOptional()
  @IsString()
  reaction_detail?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight_kg?: number;

  @IsOptional()
  @IsString()
  note?: string;

  // ── Status ─────────────────────────────────────────────────────────────────
  @IsOptional()
  @IsEnum(InjectionStatus)
  status?: InjectionStatus;
}

// =========================
// UPDATE (all fields optional)
// =========================

export class UpdateParasiteInjectionDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsUUID()
  administeredById?: string;

  @IsOptional()
  @IsEnum(ParasiteType)
  parasite_type?: ParasiteType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  drug_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dosage?: string;

  @IsOptional()
  @IsEnum(DrugForm)
  drug_form?: DrugForm;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  batch_number?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @IsOptional()
  @IsDateString()
  administered_date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  round_number?: number;

  @IsOptional()
  @IsDateString()
  next_due_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  treatment_program?: string;

  @IsOptional()
  @IsEnum(InjectionReaction)
  reaction?: InjectionReaction;

  @IsOptional()
  @IsString()
  reaction_detail?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight_kg?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(InjectionStatus)
  status?: InjectionStatus;
}
