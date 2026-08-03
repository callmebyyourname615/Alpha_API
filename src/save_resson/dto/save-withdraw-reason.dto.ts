// dto/save-withdraw-reason.dto.ts
import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { SaveWithdrawReasonType } from '../save-withdraw-reason-type.enum';

export class CreateSaveWithdrawReasonDto {
  @IsString()
  nameLao: string;

  @IsString()
  nameEn: string;

  // ✅ new
  @IsEnum(SaveWithdrawReasonType)
  type: SaveWithdrawReasonType;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateSaveWithdrawReasonDto {
  @IsOptional()
  @IsString()
  nameLao?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  // ✅ new
  @IsOptional()
  @IsEnum(SaveWithdrawReasonType)
  type?: SaveWithdrawReasonType;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}