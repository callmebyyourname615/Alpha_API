import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventActivity } from './eventActivity.entity';
import { FileModule } from '../file/file.module';
import { File } from '../file/files.entity';
import { Event } from '../event/events.entity';
import { EventActivityService } from './eventActivity.service';
import { EventActivityController } from './eventActivity.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EventActivity, Event, File]), FileModule],
  providers: [EventActivityService],
  controllers: [EventActivityController],
})
export class EventActivityModule {}
