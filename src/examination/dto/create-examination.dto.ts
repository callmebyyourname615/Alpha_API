import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  IsNumber,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateExaminationDto {
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()          // ✅ added
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  examDate: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxScore?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  passScore?: number;

  @IsUUID()
  @IsOptional()
  checkerId?: string;

  @IsUUID()
  @IsOptional()
  createdById?: string;

  @IsUUID()
  @IsOptional()
  superAdminRoleId?: string;
}
