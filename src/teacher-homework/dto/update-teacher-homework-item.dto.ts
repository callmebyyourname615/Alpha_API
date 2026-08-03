import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateTeacherHomeworkItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  teacherGuidePage?: string;

  @IsOptional()
  @IsString()
  itemInstruction?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @IsOptional() // ✅ new
  @IsUUID()
  classId?: string | null;
}
