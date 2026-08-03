import { Type } from 'class-transformer';
import {
  IsUUID,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class BulkResultItemDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @IsNumber()
  @Min(0)
  score: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class BulkCreateExaminationResultDto {
  @IsUUID()
  @IsNotEmpty()
  examinationId: string;

  @IsUUID()
  @IsNotEmpty()
  gradedBy: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkResultItemDto)
  results: BulkResultItemDto[];
}