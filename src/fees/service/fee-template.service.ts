import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeTemplate } from '../entities/fee-template.entity';
import { CreateFeeTemplateDto, FeeTemplateQueryDto, UpdateFeeTemplateDto } from '../dto/fee-template.dto';

@Injectable()
export class FeeTemplateService {
  constructor(
    @InjectRepository(FeeTemplate)
    private readonly feeTemplateRepo: Repository<FeeTemplate>,
  ) {}

  async create(dto: CreateFeeTemplateDto): Promise<FeeTemplate> {
    // Prevent duplicate active fee names per year level
    const existing = await this.feeTemplateRepo.findOne({
      where: {
        name: dto.name,
        year_level_id: dto.year_level_id,
        is_active: true,
      },
    });
    if (existing) {
      throw new ConflictException(
        `A fee template named "${dto.name}" already exists for this year level.`,
      );
    }

    const template = this.feeTemplateRepo.create({
      ...dto,
      is_active: dto.is_active ?? true,
    });
    return this.feeTemplateRepo.save(template);
  }

  async findAll(query: FeeTemplateQueryDto): Promise<FeeTemplate[]> {
    const where: Partial<FeeTemplate> = {};
    if (query.year_level_id) where.year_level_id = query.year_level_id;
    if (query.is_active !== undefined) where.is_active = query.is_active;

    return this.feeTemplateRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<FeeTemplate> {
    const template = await this.feeTemplateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`Fee template ${id} not found`);
    return template;
  }

  async update(id: string, dto: UpdateFeeTemplateDto): Promise<FeeTemplate> {
    const template = await this.findOne(id);
    Object.assign(template, dto);
    return this.feeTemplateRepo.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    // Soft delete: mark inactive instead of hard delete
    template.is_active = false;
    await this.feeTemplateRepo.save(template);
  }
}