import { IsDateString, IsOptional, IsString } from 'class-validator';

export class GetAttendanceRangeDto {
  @IsString()
  class_id: string; // ✅ REQUIRED

  @IsString()
  academic_year_id: string; // ✅ REQUIRED

  @IsString()
  branch_id: string; // ✅ REQUIRED

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsString()
  student_id?: string;
}
