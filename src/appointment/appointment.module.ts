// src/appointment/appointment.module.ts
import { Module }            from '@nestjs/common';
import { TypeOrmModule }     from '@nestjs/typeorm';
import { Appointment }       from './appointment.entity';
import { Branch }            from '../branches/branch.entity';
import { AcademicYear }      from '../academic_years/academic-year.entity';
import { AppointmentService }     from './appointment.service';
import { AppointmentController }  from './appointment.controller';
import { AppointmentParticipant } from './dto/appointment-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentParticipant,
      Branch,
      AcademicYear,
    ]),
  ],
  controllers: [AppointmentController],
  providers:   [AppointmentService],
  exports:     [AppointmentService],
})
export class AppointmentModule {}