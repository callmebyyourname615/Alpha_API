import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { StudentNutrition } from '../nutrition/nutrition.entity';

@Entity('food_restrictions')
@Index('idx_food_restriction_nutrition_id', ['nutritionId'])
export class FoodRestriction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  food_name: string;

  @Column('uuid', { name: 'nutrition_id' })
  nutritionId: string;

  @ManyToOne(() => StudentNutrition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nutrition_id' })
  nutrition: StudentNutrition;
}
