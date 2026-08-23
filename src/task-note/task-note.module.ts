import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskNote } from './task-note.entity';
import { TaskNoteService } from './task-note.service';
import { TaskNoteController } from './task-note.controller';
import { TaskAccessModule } from '../task-access/task-access.module';

@Module({
  imports: [TypeOrmModule.forFeature([TaskNote]), TaskAccessModule],
  providers: [TaskNoteService],
  controllers: [TaskNoteController],
  exports: [TaskNoteService],
})
export class TaskNoteModule {}
