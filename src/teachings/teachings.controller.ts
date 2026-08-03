import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreateTeachingDto } from './dto/create-teaching.dto';
import { UpdateTeachingDto } from './dto/update-teaching.dto';
import { TeachingService } from './teachings.service';
import { GetTeachingByAdminDto } from './dto/get-teaching-by-admin.dto';

@Controller('teaching')
export class TeachingController {
  constructor(private readonly teachingService: TeachingService) {}

  @Post()
  create(@Body() createDto: CreateTeachingDto) {
    return this.teachingService.create(createDto);
  }

  // Important endpoint for UI: Filter by branch (when user logs in)
  @Get()
  findAll(
    @Query('branchId') branchId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.teachingService.findAll(branchId, academicYearId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachingService.findOne(id);
  }

   @Post('by-admin')
  findByAdmin(@Body() dto: GetTeachingByAdminDto) {
    return this.teachingService.findByAdmin(dto);
  }

  
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTeachingDto,
  ) {
    return this.teachingService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachingService.remove(id);
  }
}
