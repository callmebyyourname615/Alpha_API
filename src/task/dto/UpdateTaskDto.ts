import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsIn,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayUnique,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  TaskRemindersDto,
  TaskSettingsDto,
  TaskStatuses,
  TaskDifficulties,
  AssignmentModes,
  TaskVisibilities,
  PracticeFrequencyUnits,
} from './CreateTaskDto';

const parseJson = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const parseIdArray = ({ value }: { value: unknown }) => {
  if (value == null) return value;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* fall through */
    }
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return value;
};

const parseInt10 = ({ value }: { value: unknown }) => {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
};

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  student_id?: string;

  @IsOptional()
  @IsUUID()
  added_by_id?: string;

  @IsOptional()
  @IsIn(TaskStatuses)
  status?: string;

  // -------- Wizard step 1: Task Information --------
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsIn(TaskDifficulties)
  difficulty?: string;

  @IsOptional()
  @Transform(parseInt10)
  @IsInt()
  @Min(0)
  estimated_time_minutes?: number;

  @IsOptional()
  @Transform(parseInt10)
  @IsInt()
  @Min(0)
  points?: number;

  @IsOptional()
  @Transform(parseInt10)
  @IsInt()
  @Min(1)
  practice_frequency?: number;

  @IsOptional()
  @IsIn(PracticeFrequencyUnits)
  practice_frequency_unit?: string;

  // -------- Wizard step 2: Assignment --------
  @IsOptional()
  @IsIn(AssignmentModes)
  assignment_mode?: string;

  @IsOptional()
  @Transform(parseIdArray)
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  assignment_student_ids?: string[];

  @IsOptional()
  @Transform(parseIdArray)
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  assignment_class_ids?: string[];

  @IsOptional()
  @IsUUID()
  class_id?: string;

  // -------- Wizard step 3: Schedule & Settings --------
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsString()
  due_time?: string;

  @IsOptional()
  @IsIn(TaskVisibilities)
  visibility?: string;

  @IsOptional()
  @Transform(parseJson)
  @ValidateNested()
  @Type(() => TaskRemindersDto)
  reminders?: TaskRemindersDto;

  @IsOptional()
  @Transform(parseJson)
  @ValidateNested()
  @Type(() => TaskSettingsDto)
  settings?: TaskSettingsDto;

  @IsOptional()
  @Transform(parseInt10)
  @IsInt()
  @Min(0)
  @Max(100)
  progress_pct?: number;

  @IsOptional()
  @IsUUID()
  academic_year_id?: string;
}
