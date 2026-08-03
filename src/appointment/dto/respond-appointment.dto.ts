// ============================================================
// FILE 7: src/appointment/dto/respond-appointment.dto.ts
// ============================================================
import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ParticipantStatus } from '../appointment.enum';

export class RespondAppointmentDto {
  @IsEnum(ParticipantStatus)
  status: ParticipantStatus;

  @IsOptional()
  @IsString()
  response_note?: string;
}
