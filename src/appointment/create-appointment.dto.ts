import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  branch_id: string;

  @IsString()
  @IsNotEmpty()
  academic_year_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  appointment_place: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  from_time: string;

  @IsString()
  @IsNotEmpty()
  to_time: string;

  @IsString()
  @IsNotEmpty()
  auditor_id: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}
