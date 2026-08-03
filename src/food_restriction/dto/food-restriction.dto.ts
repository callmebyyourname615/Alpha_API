import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateFoodRestrictionDto {
  @IsUUID()
  nutritionId: string;

  @IsString()
  @MaxLength(120)
  food_name: string;
}

export class UpdateFoodRestrictionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  food_name?: string;
}
