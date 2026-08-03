import { IsOptional, IsString, IsEnum, IsDateString, IsUUID } from 'class-validator';
import {
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementAudience,
} from '../announcement.entity';

export class CreateAnnouncementDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @IsOptional()
  @IsEnum(AnnouncementStatus)
  status?: AnnouncementStatus;

  @IsOptional()
  @IsEnum(AnnouncementAudience)
  target_audience?: AnnouncementAudience;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsUUID()
  branch_id?: string;
}
