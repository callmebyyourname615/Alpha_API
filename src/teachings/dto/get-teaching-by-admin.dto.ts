import { IsOptional, IsUUID } from 'class-validator';

export class GetTeachingByAdminDto {
  @IsUUID()
  adminId: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}