import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsNumber,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { NutritionalStatus, WastingStatus } from '../nutrition.entity';

// =========================
// CREATE
// =========================

export class CreateStudentNutritionDto {
  // ── Relations ──────────────────────────────────────────────────────────────
  @IsUUID()
  studentId: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  academic_year_id?: string;

  @IsOptional()
  @IsUUID()
  recordedById?: string;

  // ── Measurements ───────────────────────────────────────────────────────────
  @IsString()
  measurement_date: string; // yyyy-mm-dd

  @IsNumber()
  @IsPositive()
  @Max(300)
  weight_kg: number;

  @IsNumber()
  @IsPositive()
  @Max(300)
  height_cm: number;

  // bmi is NOT accepted from client — auto-computed in @BeforeInsert

  @IsOptional()
  @IsNumber()
  @IsPositive()
  muac_cm?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  head_circumference_cm?: number;

  // ── Nutritional status ─────────────────────────────────────────────────────
  // Auto-derived from BMI on save; accept only if manual override needed
  @IsOptional()
  @IsEnum(NutritionalStatus)
  nutritional_status?: NutritionalStatus;

  @IsOptional()
  @IsEnum(WastingStatus)
  wasting_status?: WastingStatus;

  @IsOptional()
  @IsBoolean()
  vitamin_a_given?: boolean;

  @IsOptional()
  @IsBoolean()
  iron_given?: boolean;

  // ── Tracking ───────────────────────────────────────────────────────────────
  @IsInt()
  @Min(1)
  round_number: number;

  @IsOptional()
  @IsString()
  next_screening_date?: string;

  @IsOptional()
  @IsBoolean()
  referred_for_treatment?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

// =========================
// UPDATE (all optional)
// =========================

export class UpdateStudentNutritionDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  academic_year_id?: string;

  @IsOptional()
  @IsUUID()
  recordedById?: string;

  @IsOptional()
  @IsString()
  measurement_date?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(300)
  weight_kg?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(300)
  height_cm?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  muac_cm?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  head_circumference_cm?: number;

  @IsOptional()
  @IsEnum(NutritionalStatus)
  nutritional_status?: NutritionalStatus;

  @IsOptional()
  @IsEnum(WastingStatus)
  wasting_status?: WastingStatus;

  @IsOptional()
  @IsBoolean()
  vitamin_a_given?: boolean;

  @IsOptional()
  @IsBoolean()
  iron_given?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  round_number?: number;

  @IsOptional()
  @IsString()
  next_screening_date?: string;

  @IsOptional()
  @IsBoolean()
  referred_for_treatment?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}