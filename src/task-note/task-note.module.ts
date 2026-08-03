import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskNote } from './task-note.entity';
import { TaskNoteService } from './task-note.service';
import { TaskNoteController } from './task-note.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskNote])],
  providers: [TaskNoteService],
  controllers: [TaskNoteController],
  exports: [TaskNoteService],
})
export class TaskNoteModule {}
