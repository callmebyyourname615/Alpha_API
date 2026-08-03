import { AuditorType, ModuleType } from "../comments.entity";

// update-comment.dto.ts
export class UpdateCommentDto {
  comment?: string;
  auditor_id?: string;
  auditor_type?: AuditorType;
  module_id?: string;           // <--- uuid
  module_type?: ModuleType;
}


