import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSubjectTypeDto } from './dto/create-subject-type.dto';
import { UpdateSubjectTypeDto } from './dto/update-subject-type.dto';
import { SubjectType } from './subject-type.entity';
import { CacheService } from '../common/cache.service';

@Injectable()
export class SubjectTypeService {
<<<<<<< HEAD
  constructor(
    @InjectRepository(SubjectType)
    private subjectTypeRepo: Repository<SubjectType>,

    private readonly cache: CacheService,
  ) {}

  async create(createDto: CreateSubjectTypeDto): Promise<SubjectType> {
    const subject = this.subjectTypeRepo.create(createDto);
    const saved = await this.subjectTypeRepo.save(subject);
    await this.clearSubjectTypeCache(saved.id);
    return saved;
  }

  async findAll(): Promise<SubjectType[]> {
    return this.cache.getOrSet('subject-types:all', 900, () =>
      this.subjectTypeRepo.find({
        where: { is_deleted: false },
        order: { created_at: 'DESC' },
      }),
    );
  }

  async findOne(id: string): Promise<SubjectType> {
    const subjectType = await this.cache.getOrSet(
      `subject-types:${id}`,
      900,
      () => this.findOneUncached(id),
    );

    return subjectType;
  }

  private async findOneUncached(id: string): Promise<SubjectType> {
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
    const subjectType = await this.findOneUncached(id);
=======
  constructor(
    @InjectRepository(SubjectType)
    private subjectTypeRepo: Repository<SubjectType>,

    private readonly cache: CacheService,
  ) {}

  async create(createDto: CreateSubjectTypeDto): Promise<SubjectType> {
    const name = String(createDto.name || '').trim();
    const existing = await this.subjectTypeRepo.findOne({ where: { name } });

    // Records created before hard delete was enabled can still be soft-deleted.
    // Reuse and restore them so the unique name constraint does not block users.
    if (existing) {
      if (existing.is_deleted) {
        existing.is_deleted = false;
        existing.is_active = true;
        const restored = await this.subjectTypeRepo.save(existing);
        await this.clearSubjectTypeCache(restored.id);
        return restored;
      }

      throw new ConflictException(`Subject type "${name}" already exists`);
    }

    const subject = this.subjectTypeRepo.create({ ...createDto, name });
    const saved = await this.subjectTypeRepo.save(subject);
    await this.clearSubjectTypeCache(saved.id);
    return saved;
  }

  async findAll(): Promise<SubjectType[]> {
    return this.cache.getOrSet('subject-types:all', 900, () =>
      this.subjectTypeRepo.find({
        where: { is_deleted: false },
        order: { created_at: 'DESC' },
      }),
    );
  }

  async findOne(id: string): Promise<SubjectType> {
    const subjectType = await this.cache.getOrSet(`subject-types:${id}`, 900, () =>
      this.findOneUncached(id),
    );

    return subjectType;
  }

  private async findOneUncached(id: string): Promise<SubjectType> {
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
    const subjectType = await this.findOneUncached(id);
>>>>>>> e882894 (a)

    // Merge DTO into entity
    Object.assign(subjectType, updateDto);

    const saved = await this.subjectTypeRepo.save(subjectType);
    await this.clearSubjectTypeCache(id);
    return saved;
  }

<<<<<<< HEAD
  // Soft Delete (Recommended)
  async remove(id: string): Promise<{ message: string }> {
    const subjectType = await this.findOneUncached(id);

    subjectType.is_deleted = true;
    subjectType.is_active = false;

    await this.subjectTypeRepo.save(subjectType);
    await this.clearSubjectTypeCache(id);

    return {
      message: `SubjectType with ID ${id} has been soft deleted successfully`,
    };
  }
=======
  // Subject types are permanently deleted. PostgreSQL foreign-key constraints
  // protect types that are still used by lessons or subjects.
  async remove(id: string): Promise<{ message: string }> {
    const subjectType = await this.findOneUncached(id);

    try {
      await this.subjectTypeRepo.remove(subjectType);
      await this.clearSubjectTypeCache(id);
      return { message: 'Subject type permanently deleted' };
    } catch (error: any) {
      if (error?.code === '23503' || error?.driverError?.code === '23503') {
        throw new ConflictException(
          `Subject type "${subjectType.name}" is in use and cannot be deleted`,
        );
      }
      throw error;
    }
  }
>>>>>>> e882894 (a)

  // Hard Delete (only if you really need it)
  async hardDelete(id: string): Promise<{ message: string }> {
    const subjectType = await this.findOneUncached(id);
    await this.subjectTypeRepo.remove(subjectType);
    await this.clearSubjectTypeCache(id);

    return { message: 'SubjectType permanently deleted' };
  }

  private async clearSubjectTypeCache(id?: string): Promise<void> {
    await this.cache.del('subject-types:all');
    await this.cache.delPattern('subjects:*');
    await this.cache.del('branches:all');
    if (id) await this.cache.del(`subject-types:${id}`);
  }
}
