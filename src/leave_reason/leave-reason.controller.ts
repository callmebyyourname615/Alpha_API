import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaveReasonService } from './leave-reason.service';
import { CreateLeaveReasonDto, UpdateLeaveReasonDto } from './dto/leave-reason.dto';

@ApiTags('Leave Reasons')
@Controller('leave-reasons')
export class LeaveReasonController {
  constructor(private readonly leaveReasonService: LeaveReasonService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new leave reason' })
  create(@Body() createDto: CreateLeaveReasonDto) {
    return this.leaveReasonService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all leave reasons' })
  findAll(@Query('status') status?: string) {
    // Convert query string to boolean if provided
    const parsedStatus = status === undefined ? undefined : status === 'true';
    return this.leaveReasonService.findAll(parsedStatus);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a leave reason by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveReasonService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a leave reason' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateLeaveReasonDto,
  ) {
    return this.leaveReasonService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a leave reason' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveReasonService.remove(id);
  }
}