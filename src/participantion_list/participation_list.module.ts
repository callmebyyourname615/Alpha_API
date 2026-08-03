import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipationListService } from './participation_list.service';
import { ParticipationListController } from './participation_list.controller';
import { ParticipationList } from './participation_list.entity';
import { Level } from '../levels/level.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ParticipationList, Level]),
  ],
  providers: [ParticipationListService],
  controllers: [ParticipationListController],
})
export class ParticipationListModule {}
