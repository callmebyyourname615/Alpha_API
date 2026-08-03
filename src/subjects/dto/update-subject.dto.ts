import { IsUUID, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubjectDto {
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

  // ✅ replace entire lesson set
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
