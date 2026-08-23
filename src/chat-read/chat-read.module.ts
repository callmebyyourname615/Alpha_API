import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRead } from './chat-read.entity';
import { ChatReadService } from './chat-read.service';
import { ChatReadController } from './chat-read.controller';
import { TaskAccessModule } from '../task-access/task-access.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRead]), TaskAccessModule],
  providers: [ChatReadService],
  controllers: [ChatReadController],
  exports: [ChatReadService],
})
export class ChatReadModule {}
