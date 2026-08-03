import {
  IsUUID,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateFeeAssignmentDto {
  @IsUUID()
  fee_template_id: string;

  @IsUUID()
  class_id: string;

  @IsUUID()
  academic_year_id: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  yearly_discount?: number;   // discount amount if parent pays full year

  @IsOptional()
  @IsDateString()
  due_date?: string;
}

export class FeeAssignmentQueryDto {
  @IsOptional()
  @IsUUID()
  class_id?: string;

  @IsOptional()
  @IsUUID()
  academic_year_id?: string;

  @IsOptional()
  @IsUUID()
  fee_template_id?: string;
}