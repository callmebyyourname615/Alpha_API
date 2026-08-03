import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const parseInt10 = ({ value }: { value: unknown }) => {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
};

export class UpdateTaskSubmissionDto {
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
  @IsIn(['not_started', 'in_progress', 'submitted', 'reviewed'])
  status?: string;

  @IsOptional()
  @IsUUID()
  reviewed_by_id?: string;

  @IsOptional()
  @IsString()
  reviewed_by_type?: string;
}
