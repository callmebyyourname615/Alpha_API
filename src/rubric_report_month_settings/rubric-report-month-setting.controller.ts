import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  RubricReportMonthSettingService,
  type SaveRubricReportMonthSettingDto,
} from './rubric-report-month-setting.service';

@Controller('rubric-report-month-settings')
export class RubricReportMonthSettingController {
  constructor(private readonly service: RubricReportMonthSettingService) {}

  @Get()
  async getSettings() {
    return { data: await this.service.findAll() };
  }

  @Put()
  async saveSetting(@Body() body: { setting?: SaveRubricReportMonthSettingDto }) {
    const setting = await this.service.save(body?.setting || (body as SaveRubricReportMonthSettingDto));
    return { data: await this.service.findAll(), setting };
  }
}
