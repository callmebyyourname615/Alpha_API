import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';

import { AttendanceRuleService } from './attendance-rule.service';

@Controller('attendance-rules')
export class AttendanceRuleController {
  constructor(private service: AttendanceRuleService) {}

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Post('upsert-by-level')
  upsertByLevel(@Body() dto: { levelId: string; rules: any[] }) {
    return this.service.upsertByLevel(dto.levelId, dto.rules);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('by-level/:levelId')
  findByLevel(@Param('levelId') levelId: string) {
    return this.service.findByLevel(levelId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}