import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HomeworkItemScoreDto {
  @IsUUID()
  @IsNotEmpty()
  homeworkItemId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  score: number;
}

export class CreateHomeworkResultDto {
  @IsUUID()
  @IsNotEmpty()
  homeworkId: string;

  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  score: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomeworkItemScoreDto)
  @IsOptional()
  itemScores?: HomeworkItemScoreDto[];

  @IsString()
  @IsOptional()
  submissionFile?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsDateString()
  @IsOptional()
  submittedAt?: string;
}
