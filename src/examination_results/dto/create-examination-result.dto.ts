import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateExaminationResultDto {
  @IsUUID()
  @IsNotEmpty()
  examinationId: string;

  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @IsUUID()
  @IsNotEmpty()
  gradedBy: string;

  @IsNumber()
  @Min(0)
  score: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsDateString()
  @IsOptional()
  gradedAt?: string;
}