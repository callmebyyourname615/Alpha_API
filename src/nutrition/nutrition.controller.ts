import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { StudentNutritionService } from './nutrition.service';
import { CreateStudentNutritionDto, UpdateStudentNutritionDto } from './dto/nutrition.dto';

@Controller('student-nutritions')
export class StudentNutritionController {
  constructor(private readonly service: StudentNutritionService) {}

  // ===========================================================================
  // READ
  // ===========================================================================

  /**
   * GET /student-nutritions
   * Returns all records (not deleted), newest first.
   */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /**
   * GET /student-nutritions/by-student/:studentId
   * Returns full nutrition history for a specific student.
   */
  @Get('by-student/:studentId')
  findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.findByStudent(studentId);
  }

  /**
   * GET /student-nutritions/latest-by-branch/:branchId
   * Returns the most recent nutrition record per student in a branch.
   * Useful for dashboard/overview screens.
   */
  @Get('latest-by-branch/:branchId')
  findLatestByBranch(@Param('branchId', ParseUUIDPipe) branchId: string) {
    return this.service.findLatestByBranch(branchId);
  }

  /**
   * GET /student-nutritions/:id
   * Returns a single record by ID.
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ===========================================================================
  // CREATE
  // ===========================================================================

  /**
   * POST /student-nutritions
   * Body: CreateStudentNutritionDto
   *
   * BMI is auto-computed from weight_kg + height_cm.
   * nutritional_status and wasting_status are auto-derived on save.
   *
   * Sample body:
   * {
   *   "studentId":      "uuid",
   *   "branchId":       "uuid",
   *   "recordedById":   "uuid",
   *   "measurement_date": "2026-07-09",
   *   "weight_kg":      18.5,
   *   "height_cm":      110.0,
   *   "muac_cm":        13.2,
   *   "round_number":   1,
   *   "vitamin_a_given": true,
   *   "iron_given":     false,
   *   "referred_for_treatment": false,
   *   "note":           "Healthy, no concerns"
   * }
   */
  @Post()
  create(@Body() dto: CreateStudentNutritionDto) {
    return this.service.create(dto);
  }

  // ===========================================================================
  // UPDATE
  // ===========================================================================

  /**
   * PUT /student-nutritions/:id
   * Body: UpdateStudentNutritionDto (all fields optional)
   * BMI + status are re-computed if weight or height changed.
   */
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentNutritionDto,
  ) {
    return this.service.update(id, dto);
  }

  // ===========================================================================
  // DELETE
  // ===========================================================================

  /**
   * DELETE /student-nutritions/:id
   * Soft delete — sets is_deleted: true, is_active: false.
   */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}