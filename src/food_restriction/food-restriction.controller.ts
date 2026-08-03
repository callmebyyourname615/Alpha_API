import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { FoodRestrictionService } from './food-restriction.service';
import {
  CreateFoodRestrictionDto,
  UpdateFoodRestrictionDto,
} from './dto/food-restriction.dto';

@Controller('food-restrictions')
export class FoodRestrictionController {
  constructor(private readonly service: FoodRestrictionService) {}

  @Post()
  create(@Body() dto: CreateFoodRestrictionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('nutrition/:nutritionId')
  findByNutrition(@Param('nutritionId') nutritionId: string) {
    return this.service.findByNutrition(nutritionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFoodRestrictionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
