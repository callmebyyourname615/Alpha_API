<<<<<<< HEAD
export class SearchStudentByClassDto {
  classIds: string[]; // รองรับหลาย class
  branchId?: string;
  academicYearId?: string;
  isActive?: boolean;
}
=======
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class SearchStudentByClassDto {
  @IsArray()
  @IsString({ each: true })
  classIds: string[]; // รองรับหลาย class

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  academicYearId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
>>>>>>> e882894 (a)
