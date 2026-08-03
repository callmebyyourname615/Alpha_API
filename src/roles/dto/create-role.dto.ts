import { IsString, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  level?: number;

  @IsOptional()
  is_deleted?: boolean;
}
