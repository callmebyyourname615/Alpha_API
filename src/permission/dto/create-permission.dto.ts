import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreatePermissionDto {
  @IsUUID()
  @IsNotEmpty()
  role_id: string;

  @IsUUID()
  @IsNotEmpty()
  moduleId: string;

  @IsUUID()
  @IsNotEmpty()
  admin_id: string;

  @IsOptional()
  @IsBoolean()
  can_add?: boolean;

  @IsOptional()
  @IsBoolean()
  can_view?: boolean;

  @IsOptional()
  @IsBoolean()
  can_edit?: boolean;

  @IsOptional()
  @IsBoolean()
  can_update_password?: boolean;

  @IsOptional()
  @IsBoolean()
  can_delete?: boolean;

  @IsOptional()
  @IsBoolean()
  can_export?: boolean;
}
