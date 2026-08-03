import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Announcement, AnnouncementStatus } from './announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private repo: Repository<Announcement>,
  ) {}

  // ================= CREATE =================
  async create(dto: CreateAnnouncementDto) {
    const data = this.repo.create(dto);
    return await this.repo.save(data);
  }

  // ================= GET ALL =================
  async findAll() {
    return await this.repo.find({
      where: { is_deleted: false },
      relations: ['branch'],
      order: { created_at: 'DESC' },
    });
  }

  // ================= GET ACTIVE =================
  async findActive() {
    const today = new Date().toISOString().split('T')[0];
    return await this.repo.find({
      where: {
        is_deleted: false,
        status: AnnouncementStatus.ACTIVE,
        start_date: LessThanOrEqual(today),
        end_date: MoreThanOrEqual(today),
      },
      relations: ['branch'],
      order: { created_at: 'DESC' },
    });
  }

  // ================= GET BY ID =================
  async findOne(id: string) {
    const data = await this.repo.findOne({
      where: { id, is_deleted: false },
      relations: ['branch'],
    });

    if (!data) throw new NotFoundException('Announcement not found');
    return data;
  }

  // ================= UPDATE =================
  async update(id: string, dto: UpdateAnnouncementDto) {
    const data = await this.findOne(id);
    Object.assign(data, dto);
    return await this.repo.save(data);
  }

  // ================= DELETE (soft delete) =================
  async remove(id: string) {
    const data = await this.findOne(id);
    data.is_deleted = true;
    return await this.repo.save(data);
  }

  // ================= GET BY BRANCH =================
  async findByBranch(body: { branch_id: string }) {
    return await this.repo.find({
      where: { branch_id: body.branch_id, is_deleted: false },
      relations: ['branch'],
      order: { created_at: 'DESC' },
    });
  }
}
