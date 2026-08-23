import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
  MinLength,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// =========================
// NESTED DTOs
// =========================

export class HistoryWorkDto {
  @IsString() from_date: string;
  @IsString() to_date: string;
  @IsString() work_place: string;
  @IsString() position: string;
  @IsString() academy_year: string;
  @IsString() teach_level: string;
  @IsString() history_school: string;
  @IsOptional() @IsString() work_permit_image?: string;
}

export class EducationLevelDto {
  @IsString() edu_qualification: string;
  @IsString() school_name: string;
  @IsString() from_date: string;
  @IsString() to_date: string;
  @IsOptional() @IsString() certificate_image?: string;
}

export class EmergencyWithDto {
  @IsString() first_name: string;
  @IsString() last_name: string;
  @IsOptional() @IsString() job?: string;
  @IsOptional() @IsString() work_place?: string;
  @IsOptional() @IsString() doctor_contract?: string;
  @IsOptional() @IsString() social_security_no?: string;
  @IsOptional() @IsString() ss_image?: string;
  @IsOptional() @IsString() hospital?: string;
}

export class BosInfoDto {
  @IsString() first_name: string;
  @IsOptional() @IsString() first_name_La?: string;
  @IsString() last_name: string;
  @IsOptional() @IsString() last_name_La?: string;
  @IsOptional() @IsString() middle_name?: string;
  @IsOptional() @IsString() middle_name_La?: string;
  @IsOptional() @IsString() nick_name?: string;
  @IsOptional() @IsString() dob?: string;
  @IsOptional() @IsString() work_place?: string;
  @IsOptional() @IsString() phone?: string;
}

export class FamilyInfoDto {
  @IsString() first_name: string;
  @IsOptional() @IsString() first_name_La?: string;
  @IsString() last_name: string;
  @IsOptional() @IsString() last_name_La?: string;
  @IsOptional() @IsString() middle_name?: string;
  @IsOptional() @IsString() middle_name_La?: string;
  @IsOptional() @IsString() nick_name?: string;
  @IsOptional() @IsString() dob?: string;
  @IsOptional() @IsString() id_card_image?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() ethnicity?: string;
  @IsOptional() @IsString() religion?: string;
  @IsOptional() @IsString() education_level?: string;
  @IsOptional() @IsString() village?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() home_no?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() home_map?: string;
  @IsOptional() @IsString() family_book_no?: string;
  @IsOptional() @IsString() phone1?: string;
  @IsOptional() @IsString() phone2?: string;
  @IsOptional() @IsString() job?: string;
  @IsOptional() @IsString() work_place?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() profile?: string;
}

export class RestrictionItemDto {
  @IsString() name: string;
  @IsOptional() @IsString() date?: string;
}

export class OtherRestrictionDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestrictionItemDto)
  medicine?: RestrictionItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestrictionItemDto)
  food?: RestrictionItemDto[];
}

// =========================
// CREATE DTO
// =========================

export class CreateAdminDto {
  // ── Required ──────────────────────────────────────────────────────────────
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  // ── Basic info ────────────────────────────────────────────────────────────
  @IsOptional() @IsDateString() join_date?: string;
  @IsOptional() @IsString() first_name?: string;
  @IsOptional() @IsString() last_name?: string;
  @IsOptional() @IsString() first_name_La?: string;
  @IsOptional() @IsString() last_name_La?: string;
  @IsOptional() @IsString() middle_name?: string;
  @IsOptional() @IsString() middle_name_La?: string;
  @IsOptional() @IsString() nick_name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() tell?: string;
  @IsOptional() @IsDateString() dob?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() ethnicity?: string;
  @IsOptional() @IsString() religion?: string;
  @IsOptional() @IsString() id_card_number?: string;
  @IsOptional() @IsString() id_card_image?: string;
  @IsOptional() @IsString() passport_number?: string;
  @IsOptional() @IsString() passport_image?: string;
  @IsOptional() @IsString() current_status?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() village?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() birth_village?: string;
  @IsOptional() @IsString() birth_district?: string;
  @IsOptional() @IsString() birth_province?: string;
  @IsOptional() @IsString() home_address?: string;
  @IsOptional() @IsString() home_picture_url?: string;
  @IsOptional() @IsString() current_academic_year?: string;
  @IsOptional() @IsString() profile_pic?: string;
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active?: boolean;

  // ── Relations ─────────────────────────────────────────────────────────────
@IsOptional()
@Transform(({ value }) => {
  if (!value) return undefined;
  return Array.isArray(value) ? value : [value];
})
@IsArray()
@IsUUID('4', { each: true })
role_ids?: string[];

  @IsOptional()
  @IsUUID()
  branch_id?: string;

  // ── JSONB arrays ──────────────────────────────────────────────────────────
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryWorkDto)
  history_work?: HistoryWorkDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationLevelDto)
  education_level?: EducationLevelDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyWithDto)
  emergency_with?: EmergencyWithDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BosInfoDto)
  bos_info?: BosInfoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyInfoDto)
  family_info?: FamilyInfoDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OtherRestrictionDto)
  other_restriction?: OtherRestrictionDto;
}

// =========================
// UPDATE DTO — all optional
// =========================

export class UpdateAdminDto {
  @IsOptional() @IsString() @MinLength(3) username?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsDateString() join_date?: string;
  @IsOptional() @IsString() first_name?: string;
  @IsOptional() @IsString() last_name?: string;
  @IsOptional() @IsString() first_name_La?: string;
  @IsOptional() @IsString() last_name_La?: string;
  @IsOptional() @IsString() middle_name?: string;
  @IsOptional() @IsString() middle_name_La?: string;
  @IsOptional() @IsString() nick_name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() tell?: string;
  @IsOptional() @IsDateString() dob?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() ethnicity?: string;
  @IsOptional() @IsString() religion?: string;
  @IsOptional() @IsString() id_card_number?: string;
  @IsOptional() @IsString() id_card_image?: string;
  @IsOptional() @IsString() passport_number?: string;
  @IsOptional() @IsString() passport_image?: string;
  @IsOptional() @IsString() current_status?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() village?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() birth_village?: string;
  @IsOptional() @IsString() birth_district?: string;
  @IsOptional() @IsString() birth_province?: string;
  @IsOptional() @IsString() home_address?: string;
  @IsOptional() @IsString() home_picture_url?: string;
  @IsOptional() @IsString() current_academic_year?: string;
  @IsOptional() @IsString() profile_pic?: string;
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active?: boolean;
  @IsOptional() @IsBoolean() is_deleted?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  role_ids?: string[];

  @IsOptional() @IsUUID() branch_id?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryWorkDto)
  history_work?: HistoryWorkDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationLevelDto)
  education_level?: EducationLevelDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyWithDto)
  emergency_with?: EmergencyWithDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BosInfoDto)
  bos_info?: BosInfoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyInfoDto)
  family_info?: FamilyInfoDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OtherRestrictionDto)
  other_restriction?: OtherRestrictionDto;
}
