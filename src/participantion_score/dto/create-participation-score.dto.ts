// create-participation-score.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class ParticipationScoreItemDto {
  @IsUUID()
  participationId: string;

  @IsUUID()
  studentId: string;

  @IsOptional()
  @IsString()
  studentName?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @Type(() => Number)
  @IsNumber()
  score: number;
}

export class CreateParticipationScoreDto {
  @IsUUID()
  branchId: string;

  @IsUUID()
  academicYearId: string;

  @IsUUID()
  levelId: string;

  @IsUUID()
  classId: string;

  @IsOptional()
  @IsUUID()
  addedBy?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipationScoreItemDto)
  scores: ParticipationScoreItemDto[];
}
