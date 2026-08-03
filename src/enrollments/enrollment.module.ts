// src/enrollments/enrollment.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from './enrollment.entity';
import { Student } from '../students/student.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Class } from '../classes/class.entity';
import { Branch } from '../branches/branch.entity';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, Student, AcademicYear, Class, Branch]),
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}