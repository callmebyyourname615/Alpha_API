// ============================================================
// FILE 4: src/appointment/dto/participant-input.dto.ts
// ============================================================
import { IsUUID, IsEnum } from 'class-validator';
import { PersonType }     from '../appointment.enum';

export class ParticipantInputDto {
  @IsUUID()
  person_id: string;

  @IsEnum(PersonType)
  person_type: PersonType;
}