import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ParticipationListService } from './participation_list.service';
import { CreateParticipationListDto } from './dto/create-participation-list.dto';
import { UpdateParticipationListDto } from './dto/update-participation-list.dto';

@Controller('participation-list')
export class ParticipationListController {
  constructor(private readonly service: ParticipationListService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateParticipationListDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('level/:levelId')                                        // ← was class/:classId
  findByLevel(@Param('levelId', ParseUUIDPipe) levelId: string) {
    return this.service.findByLevelId(levelId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParticipationListDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}