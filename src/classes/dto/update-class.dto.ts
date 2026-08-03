import { IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator';

export class UpdateClassDto {

  @IsOptional()
  @IsUUID()
  year_level_id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  saving_wallet?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
