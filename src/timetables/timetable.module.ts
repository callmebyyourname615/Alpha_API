// src/timetables/timetable.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Timetable } from './timetable.entity';
import { Subject } from '../subjects/subject.entity';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Timetable, Subject])],
  providers: [TimetableService],
  controllers: [TimetableController],
})
export class TimetableModule {}
