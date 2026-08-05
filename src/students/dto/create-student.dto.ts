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
import { Type } from 'class-transformer';

// =========================
// NESTED DTOs
// =========================

export class LiveWithDto {
  @IsString()                fullname:            string;
  @IsString()                nickname:            string;
  @IsString()                dob:                 string;
  @IsString()                id_card:             string;
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
  @IsString()                fullname:       string;
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
  @IsString()                fullname:         string;
  @IsOptional() @IsString()  nickname?:        string;
  @IsOptional() @IsString()  dob?:             string;
  @IsOptional() @IsString()  current_school?:  string;
  @IsOptional() @IsString()  phone1?:          string;
  @IsOptional() @IsString()  phone2?:          string;
  @IsOptional() @IsString()  current_village?: string;
  @IsOptional() @IsString()  image_url?:       string;
}

export class SchoolHistoryDto {
  @IsString() academic_year: string;
  @IsString() year_level:    string;
  @IsString() school:        string;
}

// ─── Health / disability / protective nested DTOs ──────────────────────
// Mirrors StudentHealthInfo / StudentPhysicaldisability / StudentprotectiveInfo
// from student.entity.ts

export class StudentHealthInfoDto {
  @IsString()                birth_type:           string;
  @IsString()                blood_type:           string;
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

  @IsOptional() @IsString()
  village?: string;

  @IsOptional() @IsString()
  village_bd?: string;

  @IsOptional() @IsString()
  bos_number?: string;

  // ─── JSONB array fields ──────────────────────────────────────────────
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LiveWithDto)
  live_with?: LiveWithDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  emergency_contacts?: EmergencyContactDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BosInfoDto)
  bos_info?: BosInfoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchoolHistoryDto)
  his_school_kindergarten?: SchoolHistoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchoolHistoryDto)
  his_school_primary?: SchoolHistoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentHealthInfoDto)
  health_history?: StudentHealthInfoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentPhysicaldisabilityDto)
  physical_disability?: StudentPhysicaldisabilityDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentprotectiveInfoDto)
  protective_info?: StudentprotectiveInfoDto[];

  // ─── Parents ─────────────────────────────────────────────────────────
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  parentIds?: string[];

  // ─── Approval flag ───────────────────────────────────────────────────
  // Admin's Approve button uses PUT with { is_active: true }.
  @IsOptional()
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
  @IsBoolean()
  confirmDuplicate?: boolean;
}
