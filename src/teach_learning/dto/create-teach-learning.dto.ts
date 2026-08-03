import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsUUID, Min } from 'class-validator';

export class CreateTeachLearningDto {
  @IsUUID()
  adminId: string;

  @IsUUID()
  subjectId: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  break_time: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  teaching_time: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  start_st_page: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  end_st_page: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  start_th_page: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  end_th_page: number;
}