<<<<<<< HEAD
import { AuditorType, ModuleType } from '../comments.entity';

// create-comment.dto.ts
export class CreateCommentDto {
  comment: string;
  auditor_id: string; // uuid
  auditor_type: AuditorType;
  module_id: string; // <--- uuid
  module_type: ModuleType;
  student_id?: string;
  reply_to_id?: string; // uuid of the comment being replied to, if any
}
=======
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



>>>>>>> e882894 (a)
