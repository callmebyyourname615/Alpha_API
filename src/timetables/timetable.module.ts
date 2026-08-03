// src/timetables/timetable.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Timetable } from './timetable.entity';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Timetable])],
  providers: [TimetableService],
  controllers: [TimetableController],
})
export class TimetableModule {}