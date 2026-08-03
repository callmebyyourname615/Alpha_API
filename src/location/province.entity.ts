import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { District } from './district.entity';

@Entity()
export class Province {
  @PrimaryGeneratedColumn('uuid')
  id: string; // UUID will be automatically generated

  @Column({ nullable: true })
  nameEn: string;

  @Column({ nullable: true })
  nameLa: string;

  @OneToMany(() => District, (district) => district.province, { cascade: true })
  districts: District[];
}
