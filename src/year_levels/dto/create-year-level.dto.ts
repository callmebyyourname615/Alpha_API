import { IsUUID, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateYearLevelDto {
  @IsUUID()
 levelId : string;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
