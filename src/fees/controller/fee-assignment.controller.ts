import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  CreateFeeAssignmentDto,
  FeeAssignmentQueryDto,
} from '../dto/fee-assignment.dto';
import { FeeAssignmentService } from '../service/fee-assignment.service';

@Controller('fee-assignments')
export class FeeAssignmentController {
  constructor(private readonly feeAssignmentService: FeeAssignmentService) {}

  // POST /fee-assignments
  // assigned_by is taken from the authenticated user (req.user.id)
  // Replace req.user.id with however your auth guard exposes the user
  @Post()
  create(@Body() dto: CreateFeeAssignmentDto, @Req() req: any) {
    const assignedBy = req.user?.id ?? 'system';
    return this.feeAssignmentService.create(dto, assignedBy);
  }

  // GET /fee-assignments?class_id=...&academic_year_id=...
  @Get()
  findAll(@Query() query: FeeAssignmentQueryDto) {
    return this.feeAssignmentService.findAll(query);
  }

  // GET /fee-assignments/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeAssignmentService.findOne(id);
  }

  // DELETE /fee-assignments/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeAssignmentService.remove(id);
  }
}