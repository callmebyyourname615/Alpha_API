import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ParticipationScoreService } from './participation-score.service';
import { CreateParticipationScoreDto } from './dto/create-participation-score.dto';
import { UpdateParticipationScoreDto } from './dto/update-participation-score.dto';

export interface ScoreResult {
  studentId: string;
  studentName: string;
  participationId: string;
  participationName: string;
  score: number;
}

@Controller('participation-scores')
export class ParticipationScoreController {
  constructor(private readonly service: ParticipationScoreService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateParticipationScoreDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateParticipationScoreDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('bulk-upsert')
  bulkUpsert(@Body() dto: CreateParticipationScoreDto) {
    return this.service.bulkUpsert(dto);
  }

  @Post('filter')
  filterData(
    @Body()
    body: {
      branchId: string;
      academicYearId: string;
      levelId: string;            // ← added
      classId: string;
      date: string;
    },
  ): Promise<ScoreResult[]> {
    return this.service.getScoresByFilter({
      branchId: body.branchId,
      academicYearId: body.academicYearId,
      levelId: body.levelId,      // ← added
      classId: body.classId,
      date: new Date(body.date),
    });
  }
}