import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class UpdateAppointmentDto {
  @IsString()
  @IsOptional()
  branch_id?: string;

  @IsString()
  @IsOptional()
  academic_year_id?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  appointment_place?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  from_time?: string;

  @IsString()
  @IsOptional()
  to_time?: string;

  @IsDateString()
  @IsOptional()
  rescheduled_date?: string;

  @IsString()
  @IsOptional()
  rescheduled_from_time?: string;

  @IsString()
  @IsOptional()
  rescheduled_to_time?: string;

  @IsString()
  @IsOptional()
  auditor_id?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsBoolean()
  @IsOptional()
  is_deleted?: boolean;
}
