import {
  IsString,
  IsUUID,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEmail,
  IsBoolean,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';

// =========================
// TRANSFORM HELPERS
// =========================

export const TransformJsonArray = (cls?: new (...args: any[]) => any) =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    let list = value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;
      if (trimmed === '[]') return [];
      try {
        const parsed = JSON.parse(trimmed);
        list = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [];
      }
    }
    if (!Array.isArray(list)) list = [list];
    if (cls) {
      return list.map((item: any) => plainToInstance(cls, item));
    }
    return list;
  });

export const TransformBoolean = () =>
  Transform(({ value }) => {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    if (value === '' || value === undefined || value === null) return undefined;
    return value;
  });

export const TransformParentIds = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed === '[]' || trimmed === 'null' || trimmed === 'undefined') return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((id) => typeof id === 'string' && id.trim().length > 0);
        }
        if (typeof parsed === 'string' && parsed.trim().length > 0) {
          return [parsed.trim()];
        }
      } catch {
        if (trimmed.includes(',')) {
          return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
        }
        return [trimmed];
      }
    }
    if (Array.isArray(value)) {
      return value.filter((id) => typeof id === 'string' && id.trim().length > 0);
    }
    return [];
  });

// =========================
// NESTED DTOs
// =========================

export class LiveWithDto {
  @IsOptional() @IsString()  fullname?:           string;
  @IsOptional() @IsString()  nickname?:           string;
  @IsOptional() @IsString()  dob?:                string;
  @IsOptional() @IsString()  id_card?:            string;
  @IsOptional() @IsString()  relation_type?:      string;
  @IsOptional() @IsString()  id_card_image_url?:  string;
  @IsOptional() @IsString()  passport_no?:        string;
  @IsOptional() @IsString()  passport_image_url?: string;
  @IsOptional() @IsString()  nationality?:        string;
  @IsOptional() @IsString()  ethnicity?:          string;
  @IsOptional() @IsString()  religion?:           string;
  @IsOptional() @IsString()  education_level?:    string;
  @IsOptional() @IsString()  current_village?:    string;
  @IsOptional() @IsString()  current_district?:   string;
  @IsOptional() @IsString()  current_province?:   string;
  @IsOptional() @IsString()  home_no?:            string;
  @IsOptional() @IsString()  home_unit?:          string;
  @IsOptional() @IsString()  home_map?:           string;
  @IsOptional() @IsString()  family_book_no?:     string;
  @IsOptional() @IsString()  family_book_url?:    string;
  @IsOptional() @IsString()  phone_number_one?:   string;
  @IsOptional() @IsString()  phone_number_two?:   string;
  @IsOptional() @IsString()  working_place?:      string;
  @IsOptional() @IsEmail()   email?:              string;
  @IsOptional() @IsString()  profile_image?:      string;
  @IsOptional() @IsString()  updated_at?:         string;
}

export class EmergencyContactDto {
  @IsOptional() @IsString()  fullname?:       string;
  @IsOptional() @IsString()  relationship_to_student?: string;
  @IsOptional() @IsString()  job?:           string;
  @IsOptional() @IsString()  working_place?: string;
  @IsOptional() @IsString()  phone1?:        string;
  @IsOptional() @IsString()  phone2?:        string;
  @IsOptional() @IsString()  hospital?:      string;
  @IsOptional() @IsString()  doc_name?:      string;
  @IsOptional() @IsString()  doc_contract?:  string;
}

export class BosInfoDto {
  @IsOptional() @IsString()  fullname?:        string;
  @IsOptional() @IsString()  nickname?:        string;
  @IsOptional() @IsString()  dob?:             string;
  @IsOptional() @IsString()  current_school?:  string;
  @IsOptional() @IsString()  phone1?:          string;
  @IsOptional() @IsString()  phone2?:          string;
  @IsOptional() @IsString()  current_village?: string;
  @IsOptional() @IsString()  image_url?:       string;
}

export class SiblingsInfoDto {
  @IsOptional() @IsString()  fullname?:        string;
  @IsOptional() @IsString()  nickname?:        string;
  @IsOptional() @IsString()  dob?:             string;
  @IsOptional() @IsString()  current_school?:  string;
  @IsOptional() @IsString()  phone1?:          string;
  @IsOptional() @IsString()  phone2?:          string;
  @IsOptional() @IsString()  current_province?: string;
  @IsOptional() @IsString()  current_district?: string;
  @IsOptional() @IsString()  current_village?: string;
  @IsOptional() @IsString()  image_url?:       string;
}

export class SchoolHistoryDto {
  @IsOptional() @IsString() academic_year?: string;
  @IsOptional() @IsString() year_level?:    string;
  @IsOptional() @IsString() school?:        string;
}

// ─── Health / disability / protective nested DTOs ──────────────────────
// Mirrors StudentHealthInfo / StudentPhysicaldisability / StudentprotectiveInfo
// from student.entity.ts

export class StudentHealthInfoDto {
  @IsOptional() @IsString()  birth_type?:          string;
  @IsOptional() @IsString()  blood_type?:          string;
  @IsOptional() @IsArray() @IsString({ each: true }) congenital_diseases?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) allergies?:           string[];
  @IsOptional() @IsArray() @IsString({ each: true }) teeth_condition?:     string[];
  @IsOptional() @IsArray() @IsString({ each: true }) medicine?:             string[];
}

export class StudentPhysicaldisabilityDto {
  @IsOptional() @IsString()  eye_condition?:   string;
  @IsOptional() @IsString()  ear_condition?:   string;
  @IsOptional() @IsString()  speak_condition?: string;
  @IsOptional() @IsString()  other_condition?: string;
}

export class StudentprotectiveInfoDto {
  @IsOptional() @IsString()  Neck_condition?:      string;
  @IsOptional() @IsString()  Polio_condition?:     string;
  @IsOptional() @IsString()  Liver_condition?:     string;
  @IsOptional() @IsString()  Vitamin_deficiency?:  string;
  @IsOptional() @IsString()  Worm_condition?:      string;
}

// =========================
// MAIN DTO
// =========================

export class CreateStudentDto {
  // ─── Relations ───────────────────────────────────────────────────────
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @Transform(({ value, obj }) => value || obj?.branch_id)
  @IsUUID()
  branchId: string;

  @IsOptional() @IsUUID()
  provinceId?: string;

  @IsOptional() @IsUUID()
  districtId?: string;

  @IsOptional() @IsUUID()
  provinceDbId?: string;

  @IsOptional() @IsUUID()
  districtDbId?: string;

  // ─── Basic fields ────────────────────────────────────────────────────
  @IsString()
  student_id: string;

  @IsOptional() @IsString()
  profile_image_path?: string;

  @IsOptional() @IsString()
  image_passport?: string;

  @IsOptional() @IsString()
  image_url?: string;

  @IsString()@IsOptional()
  first_name_lao: string;

  @IsString()@IsOptional()
  first_name_eng: string;

  @IsString()@IsOptional()
  midle_name_lao: string;

  @IsString()@IsOptional()
  midle_name_eng: string;

  @IsString()@IsOptional()
  last_name_lao: string;

  @IsString()@IsOptional()
  last_name_eng: string;

  @IsOptional() @IsString()
  nickname?: string;

  @IsDateString()
  dob: string;

  @IsString()
  gender: string;

  @IsOptional() @IsString()
  dm_birth?: string;

  @IsOptional() @IsString()
  passport_number?: string;

  @IsOptional() @IsString()
  nationality?: string;

  @IsOptional() @IsString()
  ethnicity?: string;

  @IsOptional() @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  parent_address?: string;

  @IsOptional()
  @IsString()
  home_map?: string;

  @IsOptional() @IsString()
  village_bd?: string;

  @IsOptional() @IsString()
  bos_number?: string;

  // ─── JSONB array fields ──────────────────────────────────────────────
  @IsOptional()
  @TransformJsonArray(LiveWithDto)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LiveWithDto)
  live_with?: LiveWithDto[];

  @IsOptional()
  @TransformJsonArray(EmergencyContactDto)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  emergency_contacts?: EmergencyContactDto[];

  @IsOptional()
  @TransformJsonArray(BosInfoDto)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BosInfoDto)
  bos_info?: BosInfoDto[];

  @IsOptional()
  @IsString()
  Siblings_number?: string;

  @IsOptional()
  @TransformJsonArray(SiblingsInfoDto)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SiblingsInfoDto)
  Siblings_info?: SiblingsInfoDto[];

  @IsOptional()
  @TransformJsonArray(SchoolHistoryDto)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchoolHistoryDto)
  his_school_nursery?: SchoolHistoryDto[];

  @IsOptional()
  @TransformJsonArray(SchoolHistoryDto)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchoolHistoryDto)
  his_school_kindergarten?: SchoolHistoryDto[];

  @IsOptional()
  @TransformJsonArray(SchoolHistoryDto)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchoolHistoryDto)
  his_school_primary?: SchoolHistoryDto[];

  @IsOptional()
  @TransformJsonArray(StudentHealthInfoDto)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentHealthInfoDto)
  health_history?: StudentHealthInfoDto[];

  @IsOptional()
  @TransformJsonArray(StudentPhysicaldisabilityDto)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentPhysicaldisabilityDto)
  physical_disability?: StudentPhysicaldisabilityDto[];

  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  health_review_required?: boolean;

  @IsOptional()
  @TransformJsonArray()
  @IsArray()
  @IsString({ each: true })
  health_review_reasons?: string[];

  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  healthReviewRequired?: boolean;

  @IsOptional()
  @TransformJsonArray()
  @IsArray()
  @IsString({ each: true })
  healthReviewReasons?: string[];

  @IsOptional()
  @TransformJsonArray(StudentprotectiveInfoDto)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentprotectiveInfoDto)
  protective_info?: StudentprotectiveInfoDto[];

  // ─── Parents ─────────────────────────────────────────────────────────
  @IsOptional()
  @TransformParentIds()
  @IsArray()
  @IsUUID('all', { each: true })
  parentIds?: string[];

  // ─── Approval flag ───────────────────────────────────────────────────
  // Admin's Approve button uses PUT with { is_active: true }.
  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  is_active?: boolean;

  // ─── Approval workflow ───────────────────────────────────────────────
  // Approve → { approval_status: 'approved', is_active: true }
  // Reject  → { approval_status: 'rejected', reject_reason: '...', is_active: false }
  @IsOptional()
  @IsString()
  approval_status?: 'pending' | 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  reject_reason?: string;

  // ─── Duplicate guard ─────────────────────────────────────────────────
  // If a student with a matching name + dob already exists under the same
  // parent, createStudent() rejects with a 409 unless this is true (the
  // parent confirmed via the app that it's intentional, e.g. twins).
  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  confirmDuplicate?: boolean;
}
