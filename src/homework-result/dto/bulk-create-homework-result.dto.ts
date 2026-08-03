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
import { Type } from 'class-transformer';
import { HomeworkItemScoreDto } from './create-homework-result.dto';

export class BulkHomeworkResultItemDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsNumber()
  @Min(0)
  score: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomeworkItemScoreDto)
  @IsOptional()
  itemScores?: HomeworkItemScoreDto[];

  @IsString()
  @IsOptional()
  remark?: string;
}

export class BulkCreateHomeworkResultDto {
  @IsUUID()
  @IsNotEmpty()
  homeworkId: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkHomeworkResultItemDto)
  results: BulkHomeworkResultItemDto[];
}
