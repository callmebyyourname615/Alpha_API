import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { Class } from './class.entity';
import { Branch } from '../branches/branch.entity';
import { YearLevel } from '../year_levels/year-level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class, Branch, YearLevel])],
  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule {}
