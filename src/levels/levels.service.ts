import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from './level.entity';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(Level)
    private readonly repo: Repository<Level>,
  ) {}

  async create(dto: CreateLevelDto): Promise<Level> {
    const level = this.repo.create(dto);
    return this.repo.save(level);
  }

  async findAll(): Promise<Level[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Level | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateLevelDto): Promise<Level | null> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
