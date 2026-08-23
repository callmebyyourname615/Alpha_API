import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RubricReportMonthSettingController } from './rubric-report-month-setting.controller';
import { RubricReportMonthSetting } from './rubric-report-month-setting.entity';
import { RubricReportMonthSettingService } from './rubric-report-month-setting.service';

@Module({
  imports: [TypeOrmModule.forFeature([RubricReportMonthSetting])],
  controllers: [RubricReportMonthSettingController],
  providers: [RubricReportMonthSettingService],
})
export class RubricReportMonthSettingModule {}
