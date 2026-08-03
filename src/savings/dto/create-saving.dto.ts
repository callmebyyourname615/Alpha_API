import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { SavingOwnerType, SavingTransactionType } from '../savings.entity';

export class CreateSavingDto {
  @IsEnum(SavingOwnerType)
  owner_type: SavingOwnerType;

  @IsUUID()
  created_by: string; // Admin (teacher/employee) who creates the saving

  @IsOptional()
  @IsUUID()
  student_id?: string;

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

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  withdraw_reason_id?: string;
}
