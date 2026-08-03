import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentPersonController } from './appointment-person.controller';
import { AppointmentPersonService } from './appointment-person.service';
import { AppointmentParticipant } from '../appointment/dto/appointment-participant.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // `appointment_persons` is also used by AppointmentModule. Register the
      // same entity here so TypeORM has one metadata definition for one table.
      AppointmentParticipant,
      Appointment,
      Branch,
      AcademicYear,
    ]),
  ],
  providers: [AppointmentPersonService],
  controllers: [AppointmentPersonController],
})
export class AppointmentPersonModule {}
