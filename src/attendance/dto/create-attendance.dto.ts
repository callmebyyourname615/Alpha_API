import {
  IsDateString,
  IsEnum,
  IsMilitaryTime,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AttendanceType, ScanMethod } from '../attendance.entity';

export class CreateAttendanceDto {
  @IsUUID()
  student_id: string;

  @IsOptional()
  @IsUUID()
  marked_by_admin_id?: string | null;

  @IsDateString()
  attendance_date: string;

  @IsOptional()
  @IsEnum(AttendanceType)
  type?: AttendanceType;

  @IsOptional()
  @IsEnum(ScanMethod)
  scan_method?: ScanMethod;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark_checkin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark_checkout?: string;

  @IsOptional()
  @IsMilitaryTime()
  check_in?: string;

  @IsOptional()
  @IsMilitaryTime()
  check_out?: string;
}