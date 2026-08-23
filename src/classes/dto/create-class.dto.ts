import { IsUUID, IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateClassDto {

  @IsUUID()
  year_level_id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  homeroom_teacher_id?: string | null;

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
