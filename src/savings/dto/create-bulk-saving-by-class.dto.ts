// dto/create-bulk-saving-by-class.dto.ts
import { SavingTransactionType } from '../savings.entity';

export class CreateBulkSavingByClassDto {
  created_by: string;
  class_id: string;
  transaction_type: SavingTransactionType;
  amount: number;
  note?: string;
  withdraw_reason_id?: string;
}