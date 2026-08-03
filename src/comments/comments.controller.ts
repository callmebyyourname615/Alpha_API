import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';

import { CommentsService } from './comments.service';
import type { ToggleReactionDto } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ModuleType } from './comments.entity';

@Controller('comments')
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  @Post(':id/reactions')
  toggleReaction(@Param('id') id: string, @Body() dto: ToggleReactionDto) {
    return this.service.toggleReaction(id, dto);
  }

  @Get(':id/reactions')
  getReactions(@Param('id') id: string) {
    return this.service.getReactions(id);
  }

  @Post()
  create(@Body() dto: CreateCommentDto) {
    return this.service.create(dto);
  }

  // comments.service.ts
  @Get()
  findAll(
    @Query('module_type') module_type?: ModuleType,
    @Query('module_id') module_id?: string,
    @Query('student_id') student_id?: string,
  ) {
    return this.service.findAll(module_type, module_id, student_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
