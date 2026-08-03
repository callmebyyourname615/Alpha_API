import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { PaymentPlan } from '../entities/enums';

export class AssignStudentFeeDto {
  @IsUUID()
  fee_assignment_id: string;

  // Assign to one or more students at once
  @IsArray()
  @IsUUID('all', { each: true })
  student_ids: string[];

  @IsEnum(PaymentPlan)
  payment_plan: PaymentPlan;
}

export class UpdatePaymentPlanDto {
  @IsEnum(PaymentPlan)
  payment_plan: PaymentPlan;
}

export class StudentFeeQueryDto {
  @IsOptional()
  @IsUUID()
  student_id?: string;

  @IsOptional()
  @IsUUID()
  fee_assignment_id?: string;

  @IsOptional()
  @IsEnum(PaymentPlan)
  payment_plan?: PaymentPlan;
}