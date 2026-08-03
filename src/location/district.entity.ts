import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Province } from './province.entity';

@Entity()
export class District {
  @PrimaryGeneratedColumn('uuid')
  id: string; // UUID

  @Column({nullable: true})
  nameEn: string;

  @Column({nullable: true})
  nameLa: string;

  @ManyToOne(() => Province, (province) => province.districts, {
    onDelete: 'CASCADE',
  })
  province: Province;
}
