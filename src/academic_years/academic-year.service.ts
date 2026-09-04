import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from './academic-year.entity';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { CacheService } from '../common/cache.service';

@Injectable()
export class AcademicYearService {
  constructor(
    @InjectRepository(AcademicYear)
    private readonly academicYearRepo: Repository<AcademicYear>,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreateAcademicYearDto): Promise<AcademicYear> {
    const academicYear = this.academicYearRepo.create(dto);
    const saved = await this.academicYearRepo.save(academicYear);
    await this.cache.del('academic-years:all');
    return saved;
  }

  async findAll(): Promise<AcademicYear[]> {
    return this.cache.getOrSet('academic-years:all', 600, () =>
      this.academicYearRepo.find({
        where: { is_deleted: false },
        order: { start_date: 'DESC' },
      }),
    );
  }

  async findOne(id: string): Promise<AcademicYear> {
    const academicYear = await this.academicYearRepo.findOne({
      where: { id, is_deleted: false },
    });
    if (!academicYear) throw new NotFoundException('Academic year not found');
    return academicYear;
  }

  async update(id: string, dto: UpdateAcademicYearDto): Promise<AcademicYear> {
    const academicYear = await this.findOne(id);
    Object.assign(academicYear, dto);
    const saved = await this.academicYearRepo.save(academicYear);
    await this.cache.del('academic-years:all');
    return saved;
  }

  async remove(id: string): Promise<{ message: string }> {
    const academicYear = await this.findOne(id);
    academicYear.is_deleted = true;
    await this.academicYearRepo.save(academicYear);
    await this.cache.del('academic-years:all');
    return { message: 'Academic year deleted successfully' };
  }
}
