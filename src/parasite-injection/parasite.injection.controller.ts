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
import { ParasiteInjectionService } from './parasite.injection.service';
import {
  CreateParasiteInjectionDto,
  UpdateParasiteInjectionDto,
} from './dto/parasite.injection.dto';

@Controller('parasite-injections')
export class ParasiteInjectionController {
  constructor(private readonly service: ParasiteInjectionService) {}

  /**
   * GET /parasite-injections
   * Returns all records (not deleted), newest first.
   */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /**
   * GET /parasite-injections/by-student/:studentId
   * Returns all injection history for a specific student.
   */
  @Get('by-student/:studentId')
  findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.findByStudent(studentId);
  }


  /**
   * GET /parasite-injections/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /**
   * POST /parasite-injections
   * Body: CreateParasiteInjectionDto
   */
  @Post()
  create(@Body() dto: CreateParasiteInjectionDto) {
    return this.service.create(dto);
  }

  /**
   * PUT /parasite-injections/:id
   * Body: UpdateParasiteInjectionDto (all fields optional)
   */
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParasiteInjectionDto,
  ) {
    return this.service.update(id, dto);
  }

  /**
   * DELETE /parasite-injections/:id
   * Soft delete only.
   */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}