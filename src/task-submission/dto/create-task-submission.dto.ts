import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const parseInt10 = ({ value }: { value: unknown }) => {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
};

export class CreateTaskSubmissionDto {
  @IsUUID()
  task_id: string;

  @IsUUID()
  student_id: string;

  @IsOptional()
  @IsString()
  answer_text?: string;

  @IsOptional()
  @Transform(parseInt10)
  @IsInt()
  @Min(0)
  @Max(100)
  progress_pct?: number;

  @IsOptional()
  @IsIn(['not_started', 'in_progress', 'submitted', 'reviewed'])
  status?: string;
}

// Used by the POST (upsert) endpoint, which both creates a submission row on
// first save and updates it on subsequent reviews — needs the review fields
// available from the very first call.
export class UpsertTaskSubmissionDto extends CreateTaskSubmissionDto {
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

  @IsOptional()
  @IsString()
  reviewed_by_type?: string;
}
