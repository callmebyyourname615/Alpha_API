import { SavingTransactionType } from "../savings.entity";

// dto/create-bulk-saving.dto.ts
export class CreateBulkSavingDto {
  created_by: string;
  student_ids: string[];           // array of student UUIDs
  transaction_type: SavingTransactionType;
  amount: number;
  note?: string;
withdraw_reason_id?: string;
}