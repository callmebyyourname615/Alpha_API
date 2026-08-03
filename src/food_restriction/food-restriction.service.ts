import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CreateFoodRestrictionDto,
  UpdateFoodRestrictionDto,
} from './dto/food-restriction.dto';
import { FoodRestriction } from './food_restriction.entity';
import { StudentNutrition } from '../nutrition/nutrition.entity';

@Injectable()
export class FoodRestrictionService {
  constructor(
    @InjectRepository(FoodRestriction)
    private readonly repo: Repository<FoodRestriction>,

    @InjectRepository(StudentNutrition)
    private readonly nutritionRepo: Repository<StudentNutrition>,
  ) {}

  private async guardNutrition(nutritionId: string): Promise<StudentNutrition> {
    const record = await this.nutritionRepo.findOne({
      where: { id: nutritionId },
    });
    if (!record) {
      throw new NotFoundException(`Nutrition record "${nutritionId}" not found`);
    }
    return record;
  }

  async create(dto: CreateFoodRestrictionDto): Promise<FoodRestriction> {
    await this.guardNutrition(dto.nutritionId);

    const record = this.repo.create({
      food_name: dto.food_name.trim(),
      nutritionId: dto.nutritionId,
    });

    return this.repo.save(record);
  }

  async findAll(): Promise<FoodRestriction[]> {
    return this.repo.find({ relations: { nutrition: true } });
  }

  async findByNutrition(nutritionId: string): Promise<FoodRestriction[]> {
    await this.guardNutrition(nutritionId);
    return this.repo.find({ where: { nutritionId } });
  }

  async findOne(id: string): Promise<FoodRestriction> {
    const record = await this.repo.findOne({
      where: { id },
      relations: { nutrition: true },
    });
    if (!record) {
      throw new NotFoundException(`Food restriction "${id}" not found`);
    }
    return record;
  }

  async update(
    id: string,
    dto: UpdateFoodRestrictionDto,
  ): Promise<FoodRestriction> {
    const record = await this.findOne(id);

    Object.assign(record, {
      food_name: dto.food_name?.trim() ?? record.food_name,
    });

    return this.repo.save(record);
  }

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);
    await this.repo.remove(record);
    return { message: `Food restriction "${id}" deleted successfully` };
  }
}
