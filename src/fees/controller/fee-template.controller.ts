import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FeeTemplateService } from '../service/fee-template.service';
import { CreateFeeTemplateDto, FeeTemplateQueryDto, UpdateFeeTemplateDto } from '../dto/fee-template.dto';

@Controller('fee-templates')
export class FeeTemplateController {
  constructor(private readonly feeTemplateService: FeeTemplateService) {}

  // POST /fee-templates
  @Post()
  create(@Body() dto: CreateFeeTemplateDto) {
    return this.feeTemplateService.create(dto);
  }

  // GET /fee-templates?year_level_id=...&is_active=true
  @Get()
  findAll(@Query() query: FeeTemplateQueryDto) {
    return this.feeTemplateService.findAll(query);
  }

  // GET /fee-templates/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeTemplateService.findOne(id);
  }

  // PATCH /fee-templates/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeeTemplateDto,
  ) {
    return this.feeTemplateService.update(id, dto);
  }

  // DELETE /fee-templates/:id  (soft delete)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.feeTemplateService.remove(id);
  }
}