import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './events.entity';
import { EventActivity } from '../eventactivity/eventActivity.entity';
import { File } from '../file/files.entity';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { FileService } from '../file/file.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventActivity, File])],
  controllers: [EventController],
  providers: [EventService, FileService],
  exports: [EventService],
})
export class EventModule {}
