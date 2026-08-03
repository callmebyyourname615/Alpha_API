// src/teachings/dto/create-teaching.dto.ts
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateTeachingDto {
  @IsUUID()
  @IsNotEmpty()
  adminId: string; // teacher

  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsNotEmpty()
  branchId: string;
}