// save-withdraw-reason.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SaveWithdrawReason } from './save-withdraw-reason.entity';
import { SaveWithdrawReasonType } from './save-withdraw-reason-type.enum';
import {
  CreateSaveWithdrawReasonDto,
  UpdateSaveWithdrawReasonDto,
} from './dto/save-withdraw-reason.dto';

@Injectable()
export class SaveWithdrawReasonService {
  constructor(
    @InjectRepository(SaveWithdrawReason)
    private readonly repo: Repository<SaveWithdrawReason>,
  ) {}

  async create(dto: CreateSaveWithdrawReasonDto): Promise<SaveWithdrawReason> {
    const record = this.repo.create({
      nameLao: dto.nameLao,
      nameEn:  dto.nameEn,
      type:    dto.type,
      status:  dto.status ?? true,
    });
    return await this.repo.save(record);
  }

  async findAll(): Promise<SaveWithdrawReason[]> {
    return await this.repo.find({
      order: { create_dt: 'DESC' },
    });
  }

  async findAllActive(): Promise<SaveWithdrawReason[]> {
    return await this.repo.find({
      where: { status: true },
      order: { create_dt: 'DESC' },
    });
  }

  // ✅ new — get reasons for a specific transaction type
  // returns type=deposit + type=both  OR  type=withdraw + type=both
  async findByType(type: SaveWithdrawReasonType): Promise<SaveWithdrawReason[]> {
    return await this.repo.find({
      where: [
        { type, status: true },
        { type: SaveWithdrawReasonType.BOTH, status: true },
      ],
      order: { create_dt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SaveWithdrawReason> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`SaveWithdrawReason "${id}" not found`);
    return record;
  }

  async update(id: string, dto: UpdateSaveWithdrawReasonDto): Promise<SaveWithdrawReason> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return await this.repo.save(record);
  }

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);
    await this.repo.remove(record);
    return { message: `SaveWithdrawReason "${id}" deleted successfully` };
  }

  async toggleStatus(id: string): Promise<SaveWithdrawReason> {
    const record = await this.findOne(id);
    record.status = !record.status;
    return await this.repo.save(record);
  }
}