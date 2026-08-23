import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsArray,
  ArrayUnique,
  IsIn,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Multipart form-data sends nested objects and arrays as JSON strings.
// Parse them so validation/service see the real shape.
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

const parseBool = ({ value }: { value: unknown }) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return value;
};

const parseInt10 = ({ value }: { value: unknown }) => {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
};

export const AddedByTypes = [
  'admin',
  'parent',
  'teacher',
  'staff',
  'superadmin',
] as const;
export type AddedByType = (typeof AddedByTypes)[number];

export const TaskStatuses = [
  'draft',
  'assigned',
  'in_progress',
  'submitted',
  'completed',
  'overdue',
] as const;
export type TaskStatus = (typeof TaskStatuses)[number];

export const TaskDifficulties = ['easy', 'medium', 'hard'] as const;
export type TaskDifficulty = (typeof TaskDifficulties)[number];

export const AssignmentModes = ['individual', 'class', 'multiple'] as const;
export type AssignmentMode = (typeof AssignmentModes)[number];

export const TaskVisibilities = ['students', 'parents', 'classes'] as const;
export type TaskVisibility = (typeof TaskVisibilities)[number];

export const PracticeFrequencyUnits = ['week', 'month'] as const;
export type PracticeFrequencyUnit = (typeof PracticeFrequencyUnits)[number];

export class DayBeforeReminderDto {
  @IsInt()
  @Min(-7)
  @Max(-1)
  offset_days: number;

  @IsDateString()
  date: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  time: string;

  @IsDateString()
  datetime: string;
}

export class TaskRemindersDto {
  @IsOptional() @Transform(parseBool) @IsBoolean() day_before?: boolean;
  @IsOptional() @Transform(parseInt10) @IsInt() @Min(1) @Max(7) day_before_days?: number;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) day_before_time?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DayBeforeReminderDto) day_before_schedule?: DayBeforeReminderDto[];
  @IsOptional() @Transform(parseBool) @IsBoolean() due_day?: boolean;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) due_day_time?: string;
  @IsOptional() @Transform(parseBool) @IsBoolean() overdue?: boolean;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) overdue_time?: string;
}

export class SubmissionScheduleDto {
  @Transform(parseInt10)
  @IsInt()
  @Min(1)
  @Max(52)
  count: number;

  @IsArray()
  @ArrayUnique()
  @IsDateString({}, { each: true })
  dates: string[];
}

export class TaskSettingsDto {
  @IsOptional() @Transform(parseBool) @IsBoolean() allow_late_submission?: boolean;
  @IsOptional() @Transform(parseBool) @IsBoolean() allow_resubmission?: boolean;
  @IsOptional() @Transform(parseBool) @IsBoolean() require_parent_confirmation?: boolean;
  @IsOptional() @Transform(parseBool) @IsBoolean() attach_rubric?: boolean;
  @IsOptional() @Transform(parseBool) @IsBoolean() enable_discussion?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SubmissionScheduleDto)
  submission_schedule?: SubmissionScheduleDto;
}

export class CreateTaskDto {
  // -------- Required (back-compat with existing callers) --------
  @IsString()
  name: string;

  @IsDateString()
  deadline: string;

  @IsUUID()
  added_by_id: string;

  @IsEnum(AddedByTypes)
  added_by_type: AddedByType;

  // -------- Optional core --------
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  student_id?: string;

  @IsOptional()
  @IsIn(TaskStatuses)
  status?: TaskStatus;

  // -------- Wizard step 1: Task Information --------
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsIn(TaskDifficulties)
  difficulty?: TaskDifficulty;

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
  practice_frequency_unit?: PracticeFrequencyUnit;

  // -------- Wizard step 2: Assignment --------
  @IsOptional()
  @IsIn(AssignmentModes)
  assignment_mode?: AssignmentMode;

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
  visibility?: TaskVisibility;

  @IsOptional()
  @Transform(parseJson)
  @Type(() => TaskRemindersDto)
  reminders?: TaskRemindersDto;

  @IsOptional()
  @Transform(parseJson)
  @ValidateNested()
  settings?: TaskSettingsDto;

  // -------- Progress + audit --------
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
