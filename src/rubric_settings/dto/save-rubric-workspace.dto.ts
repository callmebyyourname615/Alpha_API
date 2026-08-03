import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

/** The canvas is a document model; each object retains its visual properties. */
export class SaveRubricWorkspaceDto {
  @IsOptional()
  @IsString()
  workspaceKey?: string;

  @IsArray()
  @IsObject({ each: true })
  objects: Record<string, unknown>[];
}
