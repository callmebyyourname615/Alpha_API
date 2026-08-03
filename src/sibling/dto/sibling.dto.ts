import {
  IsUUID,
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { SiblingRelationType } from '../sibling.entity';

// =========================
// CREATE
// =========================

export class CreateSiblingDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  siblingId: string;

  @IsOptional()
  @IsEnum(SiblingRelationType)
  relation_type?: SiblingRelationType;

  // if true (default), parents of either student are automatically
  // linked to both students when the sibling relationship is created
  @IsOptional()
  @IsBoolean()
  autoLinkParents?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

// Link a whole group of students as siblings of one another in one call,
// e.g. when registering 3 children from the same family at once.
export class CreateSiblingGroupDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('all', { each: true })
  studentIds: string[];

  @IsOptional()
  @IsEnum(SiblingRelationType)
  relation_type?: SiblingRelationType;

  @IsOptional()
  @IsBoolean()
  autoLinkParents?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

// =========================
// UPDATE
// =========================

export class UpdateSiblingDto {
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
// AUTO-DETECT
// =========================

// Run the auto-detection sweep restricted to one branch (optional),
// otherwise runs across all students.
export class DetectSiblingsDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  // if true, persist newly detected sibling links; if false, dry-run
  // and just return what would be created
  @IsOptional()
  @IsBoolean()
  persist?: boolean;

  @IsOptional()
  @IsBoolean()
  autoLinkParents?: boolean;
}