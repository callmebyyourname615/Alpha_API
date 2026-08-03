import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RubricSettingsController } from './rubric-settings.controller';
import { RubricSettingsService } from './rubric-settings.service';
import { RubricWorkspace } from './rubric-workspace.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RubricWorkspace])],
  controllers: [RubricSettingsController],
  providers: [RubricSettingsService],
})
export class RubricSettingsModule {}
