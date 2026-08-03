import { IsOptional, IsString } from 'class-validator';

export class UpdateLevelDto {
  @IsOptional()
  @IsString()
  name?: string;
}
