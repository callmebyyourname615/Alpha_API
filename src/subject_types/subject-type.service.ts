import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSubjectTypeDto } from './dto/create-subject-type.dto';
import { UpdateSubjectTypeDto } from './dto/update-subject-type.dto';
import { SubjectType } from './subject-type.entity';

@Injectable()
export class SubjectTypeService {
  constructor(
    @InjectRepository(SubjectType)
    private subjectTypeRepo: Repository<SubjectType>,
  ) {}

  async create(createDto: CreateSubjectTypeDto): Promise<SubjectType> {
    const subject = this.subjectTypeRepo.create(createDto);
    return await this.subjectTypeRepo.save(subject);
  }

  async findAll(): Promise<SubjectType[]> {
    return await this.subjectTypeRepo.find({
      where: { is_deleted: false },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SubjectType> {
    const subjectType = await this.subjectTypeRepo.findOne({
      where: { id, is_deleted: false },
    });

    if (!subjectType) {
      throw new NotFoundException(`SubjectType with ID ${id} not found`);
    }

    return subjectType;
  }

  // Update SubjectType
  async update(
    id: string,
    updateDto: UpdateSubjectTypeDto,
  ): Promise<SubjectType> {
    const subjectType = await this.findOne(id);

    // Merge DTO into entity
    Object.assign(subjectType, updateDto);

    return await this.subjectTypeRepo.save(subjectType);
  }

  // Soft Delete (Recommended)
  async remove(id: string): Promise<{ message: string }> {
    const subjectType = await this.findOne(id);

    subjectType.is_deleted = true;
    subjectType.is_active = false;

    await this.subjectTypeRepo.save(subjectType);

    return {
      message: `SubjectType with ID ${id} has been soft deleted successfully`,
    };
  }

  // Hard Delete (only if you really need it)
  async hardDelete(id: string): Promise<{ message: string }> {
    const subjectType = await this.findOne(id);
    await this.subjectTypeRepo.remove(subjectType);

    return { message: 'SubjectType permanently deleted' };
  }
}
