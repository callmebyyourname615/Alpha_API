import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { SaveRubricWorkspaceDto } from './dto/save-rubric-workspace.dto';
import { RubricSettingsService } from './rubric-settings.service';

@Controller('rubric-settings')
export class RubricSettingsController {
  constructor(private readonly rubricSettingsService: RubricSettingsService) {}

  @Get()
  getWorkspace(@Query('workspaceKey') workspaceKey?: string) {
    return this.rubricSettingsService.getWorkspace(workspaceKey);
  }

  @Put()
  saveWorkspace(@Body() dto: SaveRubricWorkspaceDto) {
    return this.rubricSettingsService.saveWorkspace(dto);
  }
}
