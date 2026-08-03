import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './comments.entity';
import { CommentReaction } from './comment-reaction.entity';
import { Parent } from '../parents/parent.entity';
import { Task } from '../task/task.entity';
import { EventActivity } from '../eventactivity/eventActivity.entity';
import { File } from '../file/files.entity';
import { Announcement } from '../announcements/announcement.entity';
import { Admin } from '../admins/admin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, CommentReaction, Admin, Parent, Task, Event, EventActivity, File, Announcement]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
