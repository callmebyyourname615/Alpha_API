import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { EventActivityService } from './eventActivity.service';
import { EventActivity } from './eventActivity.entity';

@Controller('event-activities')
export class EventActivityController {
  constructor(private readonly activityService: EventActivityService) {}

  @Post()
  create(
    @Body() data: Partial<EventActivity>,
    @Query('files') filePaths?: string[],
  ): Promise<EventActivity> {
    return this.activityService.create(data, filePaths);
  }

  @Get()
  findAll(): Promise<EventActivity[]> {
    return this.activityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<EventActivity> {
    return this.activityService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: Partial<EventActivity>,
    @Query('files') filePaths?: string[],
  ): Promise<EventActivity> {
    return this.activityService.update(id, data, filePaths);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.activityService.delete(id);
  }
}
