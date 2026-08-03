import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './student.entity';
import { Parent } from '../parents/parent.entity';
import { Province } from '../location/province.entity';
import { District } from '../location/district.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Branch } from '../branches/branch.entity';
import { Class } from '../classes/class.entity';
import { StudentsService } from './student.service';
import { StudentsController } from './student.controller';
import { Enrollment } from '../enrollments/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Parent,
      Branch,
      Class,
      AcademicYear,
      Province,
      District,
      Enrollment,
    ]),
  ],
  providers: [StudentsService],
  controllers: [StudentsController],
  exports: [StudentsService],
})
export class StudentModule {}