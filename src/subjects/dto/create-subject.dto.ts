import { IsUUID, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  class_id?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  subject_type_id?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  subjectTypeId?: string;

  // ✅ array of pre-created lesson IDs
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  lesson_ids?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
