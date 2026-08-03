import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teaching } from './teaching.entity';

// Import related entities (needed for relations)
import { Admin } from '../admins/admin.entity';
import { Subject } from '../subjects/subject.entity';
import { Lesson } from '../lesson/lesson.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Branch } from '../branches/branch.entity';
import { TeachingController } from './teachings.controller';
import { TeachingService } from './teachings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teaching,
      Admin,      // for relations
      Subject,    // for relations
      Lesson,
      AcademicYear,
      Branch,
    ]),
  ],
  controllers: [TeachingController],
  providers: [TeachingService],
  exports: [TeachingService],   // Export if other modules need to use TeachingService
})
export class TeachingModule {}
