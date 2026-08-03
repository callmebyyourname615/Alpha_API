// save-withdraw-reason.controller.ts
import {
  Body, Controller, Delete, Get, Param,
  ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { SaveWithdrawReasonService } from './save-withdraw-reason.service';
import { SaveWithdrawReasonType } from './save-withdraw-reason-type.enum';
import {
  CreateSaveWithdrawReasonDto,
  UpdateSaveWithdrawReasonDto,
} from './dto/save-withdraw-reason.dto';

@Controller('save-withdraw-reasons')
export class SaveWithdrawReasonController {
  constructor(private readonly service: SaveWithdrawReasonService) {}

  @Post()
  create(@Body() dto: CreateSaveWithdrawReasonDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('active')
  findAllActive() {
    return this.service.findAllActive();
  }

  // ✅ new — GET /save-withdraw-reasons/by-type?type=deposit
  //           GET /save-withdraw-reasons/by-type?type=withdraw
  @Get('by-type')
  findByType(@Query('type') type: SaveWithdrawReasonType) {
    return this.service.findByType(type);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSaveWithdrawReasonDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.toggleStatus(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}