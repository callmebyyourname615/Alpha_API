import { AuditorType, ModuleType } from '../comments.entity';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

// create-comment.dto.ts
export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsUUID()
  auditor_id: string;           // uuid

  @IsEnum(AuditorType)
  auditor_type: AuditorType;

  @IsUUID()
  module_id: string;            // <--- uuid

  @IsEnum(ModuleType)
  module_type: ModuleType;

  @IsOptional()
  @IsUUID()
  student_id?: string;

  @IsOptional()
  @IsUUID()
  reply_to_id?: string;         // uuid of the comment being replied to, if any
}



