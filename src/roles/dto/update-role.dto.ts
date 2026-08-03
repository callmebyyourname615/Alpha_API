import { IsString, IsOptional, IsBoolean, IsUUID, IsArray } from 'class-validator';

export class UpdateRoleDto {
  name?: string;
  level?: number;
  adminIds?: string[];
}
