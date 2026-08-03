// ============================================================
// FILE 5: src/appointment/dto/create-appointment.dto.ts
// ============================================================
import { Type }            from 'class-transformer';
import {
  IsString,
  IsUUID,
  IsDateString,
  IsArray,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
  Matches,
} from 'class-validator';
import { ParticipantInputDto } from './participant-input.dto';
import { CreatorRole } from '../appointment.enum';

export class CreateAppointmentDto {
  @IsUUID()
  branch_id: string;

  @IsUUID()
  academic_year_id: string;

  @IsUUID()
  created_by: string;

  @IsEnum(CreatorRole)
  creator_role: CreatorRole;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  appointment_place: string;

  @IsDateString()
  date: string;

  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'from_time must be HH:MM or HH:MM:SS' })
  from_time: string;

  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'to_time must be HH:MM or HH:MM:SS' })
  to_time: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ParticipantInputDto)
  participants: ParticipantInputDto[];
}