import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateParentDto {
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  join_date?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name_lao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name_eng?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  midle_name_lao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  midle_name_eng?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name_lao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name_eng?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobile_phone?: string;

  @IsOptional()
  @IsDateString()
  dob?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  ethnicity?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  family_book_url?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  home_address?: string;

  @IsOptional()
  @IsString()
  work_province?: string;

  @IsOptional()
  @IsString()
  work_district?: string;

  @IsOptional()
  @IsString()
  work_village?: string;

  @IsOptional()
  @IsString()
  relation_type?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return undefined;
  })
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  approval_status?: 'pending' | 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  reject_reason?: string;

  @IsOptional()
  @IsString()
  profile_pic?: string;

  @IsOptional()
  @IsString()
  id_card?: string;

  @IsOptional()
  @IsString()
  home_picture_url?: string; // ✅

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  family_book_number?: string;

  @IsOptional()
  @IsString()
  idCard_no?: string;

  @IsOptional()
  @IsString()
  passport_number?: string;

  @IsOptional()
  @IsString()
  education_level?: string;

  @IsOptional()
  @IsString()
  home_number?: string;

  @IsOptional()
  @IsString()
  home_unit?: string;

  @IsOptional()
  @IsString()
  passport_image_url?: string;

  @IsOptional()
  @IsString()
  id_card_url?: string;
}
