import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectTypeService } from './subject-type.service';
import { SubjectTypeController } from './subject-type.controller';
import { SubjectType } from './subject-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubjectType])],
  controllers: [SubjectTypeController],
  providers: [SubjectTypeService],
})
export class SubjectTypeModule {}