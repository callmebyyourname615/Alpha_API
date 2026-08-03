import {
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class MarkAsPaidDto {
  @IsOptional()
  @IsDateString()
  paid_date?: string;   // defaults to today if not provided

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;   // receipt or transaction number
}