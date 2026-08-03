import { Module }           from '@nestjs/common';
import { TypeOrmModule }    from '@nestjs/typeorm';
import { Student }          from '../students/student.entity';
import { Admin }            from '../admins/admin.entity';
import { StudentNutrition } from './nutrition.entity';
import { StudentNutritionService } from './nutrition.service';
import { StudentNutritionController } from './nutrition.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentNutrition,
      Student,
      Admin,
    ]),
  ],
  controllers: [StudentNutritionController],
  providers:   [StudentNutritionService],
  exports:     [StudentNutritionService],
})
export class StudentNutritionModule {}