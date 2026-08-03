import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateFeeTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsUUID()
  year_level_id: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateFeeTemplateDto extends PartialType(CreateFeeTemplateDto) {}

export class FeeTemplateQueryDto {
  @IsOptional()
  @IsUUID()
  year_level_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}