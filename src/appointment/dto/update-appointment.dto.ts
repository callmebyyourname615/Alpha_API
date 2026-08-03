// ============================================================
// FILE 6: src/appointment/dto/update-appointment.dto.ts
// ============================================================
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAppointmentDto }  from './create-appointment.dto';

export class UpdateAppointmentDto extends PartialType(
  OmitType(CreateAppointmentDto, [
    'created_by',
    'creator_role',
    'participants',
  ] as const),
) {}


