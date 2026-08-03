import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ChatReadService } from './chat-read.service';
import type { MarkReadDto } from './chat-read.service';

@Controller('chat-reads')
export class ChatReadController {
  constructor(private readonly service: ChatReadService) {}

  @Post()
  markRead(@Body() dto: MarkReadDto) {
    return this.service.markRead(dto);
  }

  @Get()
  getCursors(@Query('module_type') moduleType: string, @Query('module_id') moduleId?: string) {
    return this.service.getCursors(moduleType, moduleId);
  }
}
