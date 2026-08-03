import { IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';

export class UpdateYearLevelDto {
  @IsOptional()
  @IsUUID()
  levelId?: string;
  
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
