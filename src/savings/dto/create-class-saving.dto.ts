// dto/create-class-saving.dto.ts
import { IsOptional, IsUUID } from 'class-validator';
import { SavingTransactionType } from '../savings.entity';

export class CreateClassSavingDto {
  created_by: string;
  class_id: string;
  branch_id: string;
  academic_year_id: string;
  transaction_type: SavingTransactionType;
  amount: number;
  note?: string;
  @IsOptional()
  @IsUUID()
  withdraw_reason_id?: string;
}
