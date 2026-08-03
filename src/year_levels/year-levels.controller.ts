import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { YearLevelsService } from './year-levels.service';
import { CreateYearLevelDto } from './dto/create-year-level.dto';
import { UpdateYearLevelDto } from './dto/update-year-level.dto';
import { YearLevel } from './year-level.entity';

@Controller('year-levels')
export class YearLevelsController {
  constructor(private readonly service: YearLevelsService) {}

  @Post()
  create(@Body() dto: CreateYearLevelDto): Promise<YearLevel> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<YearLevel[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<YearLevel | null> {
    return this.service.findOne(id);
  }

@Put(':id')
async update(
  @Param('id') id: string,
  @Body() dto: UpdateYearLevelDto,
): Promise<YearLevel> {
  return this.service.update(id, dto);
}

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
