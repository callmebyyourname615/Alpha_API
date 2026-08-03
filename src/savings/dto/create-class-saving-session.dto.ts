// dto/create-class-saving-session.dto.ts
import { SavingTransactionType } from '../savings.entity';

export class StudentSavingEntryDto {
  student_id: string;
  amount: number;
  note?: string;
}

export class CreateClassSavingSessionDto {
  created_by: string;
  class_id: string;
  branch_id: string;
  academic_year_id: string;
  transaction_type: SavingTransactionType;

  // Class wallet transaction (optional)
  class_amount?: number;
  class_note?: string;

  // Per-student entries with individual amounts
  students: StudentSavingEntryDto[];
}