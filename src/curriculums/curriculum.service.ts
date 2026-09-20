import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Curriculum } from './curriculum.entity';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { CacheService } from '../common/cache.service';

@Injectable()
export class CurriculumService {

  constructor(
    @InjectRepository(Curriculum)
    private curriculumRepo: Repository<Curriculum>,

    private readonly cache: CacheService,
  ) {}

  async create(dto: CreateCurriculumDto): Promise<Curriculum> {

    const curriculum = this.curriculumRepo.create(dto);

    const saved = await this.curriculumRepo.save(curriculum);
    await this.clearCurriculumCache(saved.id);
    return saved;
  }

  async findAll(): Promise<Curriculum[]> {

    return this.cache.getOrSet('curriculums:all', 900, () =>
      this.curriculumRepo.find({
        order: { create_dt: 'DESC' }
      }),
    );

  }

  async findOne(id: string): Promise<Curriculum> {

    const curriculum = await this.cache.getOrSet(`curriculums:${id}`, 900, () =>
      this.findOneUncached(id),
    );

    return curriculum;
  }

  private async findOneUncached(id: string): Promise<Curriculum> {
    const curriculum = await this.curriculumRepo.findOne({
      where: { id }
    });

    if (!curriculum) {
      throw new NotFoundException(`Curriculum ${id} not found`);
    }

    return curriculum;
  }

  async update(id: string, dto: UpdateCurriculumDto): Promise<Curriculum> {

    const curriculum = await this.findOneUncached(id);

    Object.assign(curriculum, dto);

    const saved = await this.curriculumRepo.save(curriculum);
    await this.clearCurriculumCache(id);
    return saved;
  }

  async remove(id: string): Promise<{ message: string }> {

    const curriculum = await this.findOneUncached(id);

    await this.curriculumRepo.remove(curriculum);
    await this.clearCurriculumCache(id);

    return { message: 'Curriculum deleted successfully' };
  }

  private async clearCurriculumCache(id?: string): Promise<void> {
    await this.cache.del('curriculums:all');
    await this.cache.delPattern('subjects:*');
    if (id) await this.cache.del(`curriculums:${id}`);
  }

}
