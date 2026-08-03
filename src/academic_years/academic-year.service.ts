import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from './academic-year.entity';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@Injectable()
export class AcademicYearService {
  constructor(
    @InjectRepository(AcademicYear)
    private readonly academicYearRepo: Repository<AcademicYear>,
  ) {}

  async create(dto: CreateAcademicYearDto): Promise<AcademicYear> {
    const academicYear = this.academicYearRepo.create(dto);
    return this.academicYearRepo.save(academicYear);
  }

  async findAll(): Promise<AcademicYear[]> {
    return this.academicYearRepo.find({
      where: { is_deleted: false },
      order: { start_date: 'DESC' },
    });
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
    return this.academicYearRepo.save(academicYear);
  }

  async remove(id: string): Promise<{ message: string }> {
    const academicYear = await this.findOne(id);
    academicYear.is_deleted = true;
    await this.academicYearRepo.save(academicYear);
    return { message: 'Academic year deleted successfully' };
  }
}
