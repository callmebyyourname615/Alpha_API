import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateTeacherHomeworkItemDto } from './create-teacher-homework-item.dto';
import { TeacherHomeworkStatus } from '../teacher-homework-status.enum';

export class CreateTeacherHomeworkDto {
  @IsUUID()
  teachingId: string;

  @IsOptional()
  @IsUUID()
  teachLearningId?: string;

  @IsOptional() // ✅ new
  @IsUUID()
  classId?: string | null;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  overallInstruction?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(TeacherHomeworkStatus)
  status?: TeacherHomeworkStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTeacherHomeworkItemDto)
  items?: CreateTeacherHomeworkItemDto[];
}