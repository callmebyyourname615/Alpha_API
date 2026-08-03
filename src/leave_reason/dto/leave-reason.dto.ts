import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateLeaveReasonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nameEn: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nameLa: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateLeaveReasonDto extends PartialType(CreateLeaveReasonDto) {}