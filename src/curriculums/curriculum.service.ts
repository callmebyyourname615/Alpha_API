import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Curriculum } from './curriculum.entity';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';

@Injectable()
export class CurriculumService {

  constructor(
    @InjectRepository(Curriculum)
    private curriculumRepo: Repository<Curriculum>,
  ) {}

  async create(dto: CreateCurriculumDto): Promise<Curriculum> {

    const curriculum = this.curriculumRepo.create(dto);

    return this.curriculumRepo.save(curriculum);
  }

  async findAll(): Promise<Curriculum[]> {

    return this.curriculumRepo.find({
      order: { create_dt: 'DESC' }
    });

  }

  async findOne(id: string): Promise<Curriculum> {

    const curriculum = await this.curriculumRepo.findOne({
      where: { id }
    });

    if (!curriculum) {
      throw new NotFoundException(`Curriculum ${id} not found`);
    }

    return curriculum;
  }

  async update(id: string, dto: UpdateCurriculumDto): Promise<Curriculum> {

    const curriculum = await this.findOne(id);

    Object.assign(curriculum, dto);

    return this.curriculumRepo.save(curriculum);
  }

  async remove(id: string): Promise<{ message: string }> {

    const curriculum = await this.findOne(id);

    await this.curriculumRepo.remove(curriculum);

    return { message: 'Curriculum deleted successfully' };
  }

}