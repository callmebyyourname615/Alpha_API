import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { YearLevel } from '../../year_levels/year-level.entity';
import { FeeAssignment } from './fee-assignment.entity';

// Reference your existing YearLevel entity here
// import { YearLevel } from '../year-level/year-level.entity';
// import { FeeAssignment } from '../fee-assignment/fee-assignment.entity';

@Entity('fee_templates')
export class FeeTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'year_level_id' })
  year_level_id: string;

  // Uncomment when you import YearLevel entity:
   @ManyToOne(() => YearLevel, { eager: true })
   @JoinColumn({ name: 'year_level_id' })
   year_level: YearLevel;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Uncomment when FeeAssignment is imported:
   @OneToMany(() => FeeAssignment, (fa) => fa.fee_template)
   fee_assignments: FeeAssignment[];
}