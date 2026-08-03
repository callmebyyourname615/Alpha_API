import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { PromoteStudentsDto, PromoteByClassDto } from './dto/promote-students.dto';

@ApiTags('enrollments')
@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  // ── POST /enrollments ──────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enroll a student into an academic year' })
  create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentService.create(dto);
  }

  // ── POST /enrollments/promote/by-class ────────────────────────────
  // Promotes ALL students in a class at once
  @Post('promote/by-class')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Promote ALL students in a class to next year' })
  promoteByClass(@Body() dto: PromoteByClassDto) {
    return this.enrollmentService.promoteByClass(dto);
  }

  // ── POST /enrollments/promote/individual ─────────────────────────
  // Promotes selected students one by one (each to own class)
  @Post('promote/individual')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Promote selected students one by one to next year' })
  promoteIndividual(@Body() dto: PromoteStudentsDto) {
    return this.enrollmentService.promoteIndividual(dto);
  }

  // ── GET /enrollments ──────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Get all enrollments' })
  @ApiQuery({ name: 'branchId',       required: false })
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiQuery({ name: 'classId',        required: false })
  @ApiQuery({ name: 'isActive',       required: false, type: Boolean })
  findAll(
    @Query('branchId')       branchId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('classId')        classId?: string,
    @Query('isActive')       isActive?: string,
  ) {
    const isActiveBool =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.enrollmentService.findAll(branchId, academicYearId, classId, isActiveBool);
  }

  // ── GET /enrollments/student/:studentId ───────────────────────────
  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get full enrollment history for a student' })
  findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.enrollmentService.findByStudent(studentId);
  }

  // ── GET /enrollments/student/:studentId/active ────────────────────
  @Get('student/:studentId/active')
  @ApiOperation({ summary: 'Get current active enrollment for a student' })
  findActive(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.enrollmentService.findActiveByStudent(studentId);
  }

  // ── GET /enrollments/:id ──────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get one enrollment by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentService.findOne(id);
  }

  // ── PATCH /enrollments/:id ────────────────────────────────────────
  @Patch(':id')
  @ApiOperation({ summary: 'Update enrollment' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentService.update(id, dto);
  }

  // ── DELETE /enrollments/:id ───────────────────────────────────────
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an enrollment' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentService.remove(id);
  }
}