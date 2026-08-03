import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Curriculum } from './curriculum.entity';
import { CurriculumService } from './curriculum.service';
import { CurriculumController } from './curriculum.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Curriculum])],
  controllers: [CurriculumController],
  providers: [CurriculumService],
})
export class CurriculumModule {}