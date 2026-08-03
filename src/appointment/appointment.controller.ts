// ============================================================
// FILE 10: src/appointment/appointment.controller.ts
// ============================================================
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AppointmentService }    from './appointment.service';
import { CreateAppointmentDto }  from './dto/create-appointment.dto';
import { UpdateAppointmentDto }  from './dto/update-appointment.dto';
import { RespondAppointmentDto } from './dto/respond-appointment.dto';
import { CreatorRescheduleDto }  from './dto/creator-reschedule.dto';

@Controller('appointments')
export class AppointmentController {
  constructor(private service: AppointmentService) {}

  // POST /appointments
  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.service.create(dto);
  }

  // GET /appointments?page=1&limit=20
  @Get()
  findAll(
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page:  number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.findAll(page, limit);
  }

  // GET /appointments/search?dateFrom=2025-08-01&dateTo=2025-08-31
  @Get('search')
  findByDate(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo')   dateTo?:   string,
  ) {
    return this.service.findByDate(dateFrom, dateTo);
  }

  // GET /appointments/person/:personId
  @Get('person/:personId')
  findByPerson(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page:  number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.findByPerson(personId, page, limit);
  }

  // GET /appointments/created-by/:creatorId
  @Get('created-by/:creatorId')
  findByCreator(
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page:  number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.findByCreator(creatorId, page, limit);
  }

  // GET /appointments/branch/:branch_id
  @Get('branch/:branch_id')
  findByBranch(
    @Param('branch_id', ParseUUIDPipe) branch_id: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page:  number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.findByBranch(branch_id, page, limit);
  }

  // GET /appointments/:id/reschedule-requests
  // Must be above GET /:id to avoid route shadowing
  @Get(':id/reschedule-requests')
  findRescheduleRequests(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findRescheduleRequests(id);
  }

  // GET /appointments/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // PUT/PATCH /appointments/:id
  @Put(':id')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.service.update(id, dto);
  }

  // PATCH /appointments/participants/:participantId/respond
  // Must be above PATCH /:id/reschedule to avoid shadowing
  @Patch('participants/:participantId/respond')
  respond(
    @Param('participantId') participantId: string,
    @Body() dto: RespondAppointmentDto,
  ) {
    return this.service.respond(participantId, dto);
  }

  // PATCH /appointments/:id/reschedule
  @Patch(':id/reschedule')
  creatorReschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatorRescheduleDto,
  ) {
    return this.service.creatorReschedule(id, dto);
  }

  // DELETE /appointments/:id
  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.softDelete(id);
  }
}
