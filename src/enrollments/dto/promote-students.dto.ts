import { IsUUID, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Used for one-by-one promotion
export class PromoteStudentItemDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  newClassId: string;
}

// Promote ALL students in a class at once
export class PromoteByClassDto {
  @ApiProperty({ description: 'Current class UUID — promotes ALL students in it' })
  @IsUUID()
  currentClassId: string;

  @ApiProperty({ description: 'Current academic year UUID' })
  @IsUUID()
  currentAcademicYearId: string;

  @ApiProperty({ description: 'New class UUID' })
  @IsUUID()
  newClassId: string;

  @ApiProperty({ description: 'New academic year UUID' })
  @IsUUID()
  newAcademicYearId: string;
}

// Promote selected students one by one (each can go to different class)
export class PromoteStudentsDto {
  @ApiProperty({ description: 'New academic year UUID' })
  @IsUUID()
  newAcademicYearId: string;

  @ApiProperty({ type: [PromoteStudentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromoteStudentItemDto)
  students: PromoteStudentItemDto[];
}