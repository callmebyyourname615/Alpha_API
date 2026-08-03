import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { LevelsService } from './levels.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { Level } from './level.entity';

@Controller('levels')
export class LevelsController {
  constructor(private readonly service: LevelsService) {}

  @Post()
  create(@Body() dto: CreateLevelDto): Promise<Level> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<Level[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Level | null> {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLevelDto): Promise<Level | null> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
