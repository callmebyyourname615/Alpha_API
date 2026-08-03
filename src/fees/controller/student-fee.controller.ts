import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  AssignStudentFeeDto,
  UpdatePaymentPlanDto,
  StudentFeeQueryDto,
} from '../dto/student-fee.dto';
import { StudentFeeService } from '../service/student-fee.service';

@Controller('student-fees')
export class StudentFeeController {
  constructor(private readonly studentFeeService: StudentFeeService) {}

  // POST /student-fees/assign
  // Body: { fee_assignment_id, student_ids: [...], payment_plan }
  @Post('assign')
  assign(@Body() dto: AssignStudentFeeDto) {
    return this.studentFeeService.assignToStudents(dto);
  }

  // GET /student-fees?student_id=...
  // Parent view: all fees and installments for a student
  @Get()
  findAll(@Query() query: StudentFeeQueryDto) {
    return this.studentFeeService.findAll(query);
  }

  // GET /student-fees/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentFeeService.findOne(id);
  }

  // PATCH /student-fees/:id/plan
  // Change payment plan and regenerate installments (only if no payments made yet)
  @Patch(':id/plan')
  updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentPlanDto,
  ) {
    return this.studentFeeService.updatePaymentPlan(id, dto);
  }
}