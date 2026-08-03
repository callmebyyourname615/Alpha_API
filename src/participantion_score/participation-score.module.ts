import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipationScoreService } from './participation-score.service';
import { ParticipationScoreController } from './participation-score.controller';
import { ParticipationScore } from './participation-score.entity';
import { Student } from '../students/student.entity';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Admin } from '../admins/admin.entity';
import { ParticipationList } from '../participantion_list/participation_list.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParticipationScore,
      Student,
      Branch,
      AcademicYear,
      ParticipationList,
      Admin,
    ]),
  ],
  controllers: [ParticipationScoreController],
  providers: [ParticipationScoreService],
})
export class ParticipationScoreModule {}
