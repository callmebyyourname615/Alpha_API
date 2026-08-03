import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GetStudentsByDateRangeDto {
  @IsOptional()
  @IsUUID()
  class_id?: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}