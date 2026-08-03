// src/savings/dto/create-students-saving-session.dto.ts
import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SavingTransactionType } from '../savings.entity';

export class StudentSavingEntryDto {
  @IsUUID()
  student_id: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  withdraw_reason_id?: string;
}

export class CreateStudentsSavingSessionDto {
  @IsUUID()
  created_by: string;

  @IsOptional()
  @IsUUID()
  class_id?: string;

  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @IsOptional()
  @IsUUID()
  academic_year_id?: string;

  @IsEnum(SavingTransactionType)
  transaction_type: SavingTransactionType;

  @IsOptional()
  @IsString()
  shared_note?: string;

  @IsOptional()
  @IsUUID()
  withdraw_reason_id?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentSavingEntryDto)
  students: StudentSavingEntryDto[];
}