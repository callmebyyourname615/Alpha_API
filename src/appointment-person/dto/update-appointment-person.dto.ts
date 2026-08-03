import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentPersonDto } from './create-appointment-person.dto';

export class UpdateAppointmentPersonDto extends PartialType(
  CreateAppointmentPersonDto,
) {}
