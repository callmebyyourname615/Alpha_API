import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FoodRestrictionController } from './food-restriction.controller';
import { FoodRestrictionService } from './food-restriction.service';
import { FoodRestriction } from './food_restriction.entity';
import { StudentNutrition } from '../nutrition/nutrition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FoodRestriction, StudentNutrition])],
  controllers: [FoodRestrictionController],
  providers: [FoodRestrictionService],
  exports: [FoodRestrictionService],
})
export class FoodRestrictionModule {}
