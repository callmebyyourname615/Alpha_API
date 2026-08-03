import { IsString, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';

export const AddedByTypes = ['admin', 'teacher', 'staff', 'parent', 'superadmin'] as const;
export type AddedByType = (typeof AddedByTypes)[number];

export class TaskDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  deadline: string;

  @IsOptional()
  @IsUUID()
  added_by_id?: string;

  @IsOptional()
  @IsEnum(AddedByTypes)
  added_by_type?: AddedByType;
}
