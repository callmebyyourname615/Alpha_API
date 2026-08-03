import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateGalleryPostDto {
  @IsString() @MaxLength(180) title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(80) category?: string;
  @IsOptional() @IsString() @MaxLength(180) location?: string;
  @IsOptional() @IsDateString() event_start_date?: string;
  @IsOptional() @IsDateString() event_end_date?: string;
  @IsOptional() @IsIn(['public', 'private']) visibility?: 'public' | 'private';
  @IsOptional() @IsIn(['draft', 'published']) status?: 'draft' | 'published';
  @IsOptional() @IsBoolean() is_pinned?: boolean;
  @IsOptional() @IsUUID() author_id?: string;
  @IsOptional() @IsString() author_type?: string;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  photo_file_ids?: string[];
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  tagged_student_ids?: string[];
}

export class UpdateGalleryPostDto {
  @IsOptional() @IsString() @MaxLength(180) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(80) category?: string;
  @IsOptional() @IsString() @MaxLength(180) location?: string;
  @IsOptional() @IsDateString() event_start_date?: string;
  @IsOptional() @IsDateString() event_end_date?: string;
  @IsOptional() @IsIn(['public', 'private']) visibility?: 'public' | 'private';
  @IsOptional() @IsIn(['draft', 'published']) status?: 'draft' | 'published';
  @IsOptional() @IsBoolean() is_pinned?: boolean;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  photo_file_ids?: string[];
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  tagged_student_ids?: string[];
}

export class ToggleGalleryLikeDto {
  @IsUUID() actor_id: string;
  @IsString() actor_type: string;
  @IsOptional() @IsUUID() student_id?: string;
}

export class CreateGalleryCommentDto {
  @IsUUID() author_id: string;
  @IsString() author_type: string;
  @IsString() body: string;
  @IsOptional() @IsUUID() reply_to_id?: string;
  @IsOptional() @IsUUID() student_id?: string;
}
