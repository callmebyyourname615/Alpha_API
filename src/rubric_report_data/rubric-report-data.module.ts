import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RubricReportDataController } from './rubric-report-data.controller';
import { RubricReportData } from './rubric-report-data.entity';
import { RubricReportDataService } from './rubric-report-data.service';

@Module({
  imports: [TypeOrmModule.forFeature([RubricReportData])],
  controllers: [RubricReportDataController],
  providers: [RubricReportDataService],
})
export class RubricReportDataModule {}
