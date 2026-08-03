import { IsOptional, IsUUID } from 'class-validator';

export class CreateTaskSubmissionAttemptDto {
  @IsOptional()
  @IsUUID()
  file_id?: string;
}
