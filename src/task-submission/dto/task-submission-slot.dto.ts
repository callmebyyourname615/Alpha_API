import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

const parseInt10 = ({ value }: { value: unknown }) => {
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
};

export class SubmitTaskSlotDto {
  @IsUUID()
  task_id: string;

  @IsUUID()
  student_id: string;

  @Transform(parseInt10)
  @IsInt()
  @Min(1)
  @Max(52)
  schedule_index: number;

  @IsOptional()
  @IsString()
  answer_text?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  file_ids?: string[];

  @IsOptional()
  @IsUUID()
  submitted_by_id?: string;

  @IsOptional()
  @IsString()
  submitted_by_type?: string;

  @IsOptional()
  @IsUUID()
  parent_confirmed_by_id?: string;
}

export class SyncTaskSlotsDto {
  @IsUUID()
  task_id: string;

  @IsOptional()
  @IsUUID()
  actor_admin_id?: string;

  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  student_ids: string[];
}

export class ReviewTaskSlotDto {
  @IsUUID()
  task_id: string;

  @IsUUID()
  student_id: string;

  @Transform(parseInt10)
  @IsInt()
  @Min(1)
  @Max(52)
  schedule_index: number;

  @Transform(parseInt10)
  @IsInt()
  @Min(0)
  @Max(100)
  progress_pct: number;

  @IsOptional()
  @Transform(parseInt10)
  @IsInt()
  @Min(0)
  score?: number;

  @IsOptional()
  @Transform(parseInt10)
  @IsInt()
  @Min(0)
  max_score?: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsUUID()
  reviewed_by_id?: string;

  @IsOptional()
  @IsUUID()
  actor_admin_id?: string;
}
