import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MenuReadsService } from './menu-reads.service';
import {
  MarkMenuReadsDto,
  MenuResource,
  SUPPORTED_MENU_RESOURCES,
} from './dto/mark-menu-reads.dto';

@ApiTags('Menu Reads')
@Controller('menu-reads')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MenuReadsController {
  constructor(private readonly service: MenuReadsService) {}

  @Get()
  @ApiOperation({
    summary:
      'List read resource ids. Pass `resource` to filter, or omit to get a map of all supported resources.',
  })
  async list(
    @Query('studentId') studentId: string,
    @Query('resource') resource?: string,
  ) {
    if (!studentId) return { data: {} };

    if (resource) {
      const safe = SUPPORTED_MENU_RESOURCES.includes(resource as MenuResource)
        ? (resource as MenuResource)
        : null;
      if (!safe) return { data: [] };
      return { data: await this.service.findReadIds(studentId, safe) };
    }

    return { data: await this.service.findAllForStudent(studentId) };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk mark resource ids as read (idempotent).' })
  async mark(@Body() dto: MarkMenuReadsDto) {
    return this.service.markRead(dto);
  }
}
