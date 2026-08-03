import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { SavingTransactionType } from '../savings.entity';

export class UpdateSavingDto {
  @IsOptional()
  @IsUUID()
  student_id?: string;

  @IsOptional()
  @IsEnum(SavingTransactionType)
  transaction_type?: SavingTransactionType;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  note?: string;
}