import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachLearning } from './teach-learning.entity';
import { TeachLearningService } from './teach-learning.service';
import { TeachLearningController } from './teach-learning.controller';
import { Admin } from '../admins/admin.entity';
import { Subject } from '../subjects/subject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TeachLearning, Admin, Subject])],
  controllers: [TeachLearningController],
  providers: [TeachLearningService],
  exports: [TeachLearningService],
})
export class TeachLearningModule {}