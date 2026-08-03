import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateBranchDto {

  @IsString()
  branch_id: string;

  @IsString()
  branch_no: string;

  @IsOptional()
  name?: string;

  @IsOptional() @IsString()
  branch_map?: string;

  @IsOptional() @IsString()
  branch_fb?: string;

  @IsOptional() @IsString()
  branch_website?: string;

  @IsOptional()
  contact?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  address?: Record<string, any>;

  @IsOptional()
  @IsArray()
  subjects?: string[];

}