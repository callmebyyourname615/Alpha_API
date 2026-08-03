import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YearLevelsService } from './year-levels.service';
import { YearLevelsController } from './year-levels.controller';
import { YearLevel } from './year-level.entity';
import { Level } from '../levels/level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([YearLevel, Level])],
  controllers: [YearLevelsController],
  providers: [YearLevelsService],
})
export class YearLevelsModule {}
