import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  IsNotEmpty,
} from 'class-validator';
import { SiblingRelationType } from '../sibling-group.entity';

// =========================
// CREATE
// =========================

export class CreateSiblingGroupDto {
  // At least 2 students required to form a sibling group
  @IsArray()
  @ArrayMinSize(2, { message: 'A sibling group requires at least 2 students' })
  @IsUUID('all', { each: true })
  studentIds: string[];

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(SiblingRelationType)
  relation_type?: SiblingRelationType;

  // Default true: auto-union parents of all members
  @IsOptional()
  @IsBoolean()
  autoLinkParents?: boolean;

  @IsOptional()
  @IsString()
  note?: string;

   @IsUUID()
  added_by: string;
}

// =========================
// UPDATE GROUP METADATA
// =========================

export class UpdateSiblingGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(SiblingRelationType)
  relation_type?: SiblingRelationType;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// =========================
// ADD MEMBERS TO EXISTING GROUP
// =========================

export class AddMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  studentIds: string[];

  // Whether to also sync parents across the new + existing members
  @IsOptional()
  @IsBoolean()
  autoLinkParents?: boolean;

  @IsUUID()
  added_by: string;
}

// =========================
// REMOVE MEMBERS FROM GROUP
// =========================

export class RemoveMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  studentIds: string[];
}

// =========================
// AUTO-DETECT
// =========================

export class DetectSiblingGroupsDto {
  // Scope detection to a single branch (optional)
  @IsOptional()
  @IsUUID()
  branchId?: string;

  // false = dry-run, returns candidates without persisting
  @IsOptional()
  @IsBoolean()
  persist?: boolean;

  @IsOptional()
  @IsBoolean()
  autoLinkParents?: boolean;

  @IsUUID()
  added_by: string;
}