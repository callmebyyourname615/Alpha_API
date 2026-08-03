import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { SavingsService } from './savings.service';
import { CreateSavingDto } from './dto/create-saving.dto';
import { UpdateSavingDto } from './dto/update-saving.dto';
import { GetClassBalanceStudentsDto } from './dto/get-class-balance-students.dto';
import { CreateBulkSavingDto } from './dto/create-bulk-saving.dto';
import { CreateBulkSavingByClassDto } from './dto/create-bulk-saving-by-class.dto';
import { CreateClassSavingDto } from './dto/create-class-saving.dto';
import { CreateStudentsSavingSessionDto } from './dto/create-students-saving-session.dto';

@Controller('savings')
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  /** POST /savings — create a single saving (student or class) */
  @Post()
  create(@Body() createSavingDto: CreateSavingDto) {
    return this.savingsService.create(createSavingDto);
  }

  /** POST /savings/class — create a class-level saving */
  @Post('class')
  createClassSaving(@Body() dto: CreateClassSavingDto) {
    return this.savingsService.createClassSaving(dto);
  }

  /**
   * POST /savings/students/session
   * Create savings for multiple students in one call (each with individual amounts).
   */
  @Post('students/session')
  createStudentsSavingSession(@Body() dto: CreateStudentsSavingSessionDto) {
    return this.savingsService.createStudentsSavingSession(dto); // no change needed here
  }
  /**
   * POST /savings/bulk
   * Create savings for multiple students with the same amount.
   */
  @Post('bulk')
  createBulk(@Body() dto: CreateBulkSavingDto) {
    return this.savingsService.createBulk(dto);
  }

  /**
   * POST /savings/bulk/by-class
   * Create savings for every student in a class with the same amount.
   */
  @Post('bulk/by-class')
  createBulkByClass(@Body() dto: CreateBulkSavingByClassDto) {
    return this.savingsService.createBulkByClass(dto);
  }

  @Post('parent-withdraw')
  createParentWithdrawal(
    @Body()
    dto: {
      studentId: string;
      amount: number;
      note?: string;
      withdrawReasonId?: string;
    },
  ) {
    return this.savingsService.createParentWithdrawal(dto);
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  /** GET /savings — all active savings */
  @Get()
  findAll() {
    return this.savingsService.findAll();
  }

  /** GET /savings/student/:studentId/balance — student wallet balance */
  @Get('student/:studentId/balance')
  getStudentBalance(
    @Param('studentId', new ParseUUIDPipe()) studentId: string,
  ) {
    return this.savingsService.getStudentBalance(studentId);
  }

  /** GET /savings/student/:studentId/history — full saving history for a student */
  @Get('student/:studentId/history')
  getSavingHistoryByStudent(
    @Param('studentId', new ParseUUIDPipe()) studentId: string,
  ) {
    return this.savingsService.getSavingHistoryByStudent(studentId);
  }

  /** GET /savings/class/:classId/balance — class saving balance */
  @Get('class/:classId/balance')
  getClassBalance(@Param('classId', new ParseUUIDPipe()) classId: string) {
    return this.savingsService.getClassBalance(classId);
  }

  /**
   * POST /savings/class/balance-students
   * Get class balance + all student balances/history in one response.
   */
  @Post('class/balance-students')
  getClassBalanceWithStudentsByPost(@Body() body: GetClassBalanceStudentsDto) {
    return this.savingsService.getClassBalanceWithStudents(body.class_id);
  }

  /** GET /savings/:id — single saving record */
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.savingsService.findOne(id);
  }

  // ─── UPDATE / DELETE ──────────────────────────────────────────────────────

  /** PATCH /savings/:id — update transaction_type, amount, or note */
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateSavingDto: UpdateSavingDto,
  ) {
    return this.savingsService.update(id, updateSavingDto);
  }

  /** DELETE /savings/:id — soft-delete saving and recalculate balance */
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.savingsService.remove(id);
  }
}
