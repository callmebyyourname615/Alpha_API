import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { AppointmentPersonService } from './appointment-person.service';
import { CreateAppointmentPersonDto } from './dto/create-appointment-person.dto';
import { UpdateAppointmentPersonDto } from './dto/update-appointment-person.dto';
import { CheckConflictsDto } from './dto/check-conflicts.dto';

@Controller('appointment-persons')
export class AppointmentPersonController {
  constructor(private service: AppointmentPersonService) {}

  @Post()
  create(@Body() dto: CreateAppointmentPersonDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('appointment/:appointment_id')
  findByAppointment(@Param('appointment_id') appointment_id: string) {
    return this.service.findByAppointment(appointment_id);
  }

  @Post('appointment')
  findByAppointmentBody(@Body() body: { appointment_id: string }) {
    return this.service.findByAppointment(body.appointment_id);
  }

  @Post('check-conflicts')
  checkConflicts(@Body() dto: CheckConflictsDto) {
    return this.service.checkConflicts(dto);
  }
  @Get('branch/:branchId')
  findByBranch(@Param('branchId') branchId: string) {
    return this.service.findByBranch(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentPersonDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
