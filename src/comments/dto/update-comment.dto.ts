<<<<<<< HEAD
import { AuditorType, ModuleType } from '../comments.entity';

// update-comment.dto.ts
export class UpdateCommentDto {
  comment?: string;
  auditor_id?: string;
  auditor_type?: AuditorType;
  module_id?: string; // <--- uuid
  module_type?: ModuleType;
}
=======
import { AuditorType, ModuleType } from "../comments.entity";
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

// update-comment.dto.ts
export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsUUID()
  auditor_id?: string;

  @IsOptional()
  @IsEnum(AuditorType)
  auditor_type?: AuditorType;

  @IsOptional()
  @IsUUID()
  module_id?: string;           // <--- uuid

  @IsOptional()
  @IsEnum(ModuleType)
  module_type?: ModuleType;
}


>>>>>>> e882894 (a)
