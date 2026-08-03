import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
  ) {}

  // ================= CREATE =================
  async create(dto: CreateNotificationDto) {
    const data = this.repo.create(dto);
    return await this.repo.save(data);
  }

  // ================= GET ALL =================
  async findAll() {
    return await this.repo.find({
      where: { is_deleted: false },
      relations: ['branch', 'academic_year', 'student', 'parent'],
      order: { created_at: 'DESC' },
    });
  }

  // ================= GET BY ID =================
  async findOne(id: string) {
    const data = await this.repo.findOne({
      where: { id, is_deleted: false },
      relations: ['branch', 'academic_year', 'student', 'parent'],
    });

    if (!data) throw new NotFoundException('Notification not found');
    return data;
  }

  // ================= UPDATE =================
  async update(id: string, dto: UpdateNotificationDto) {
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
      relations: ['branch', 'academic_year', 'student', 'parent'],
      order: { created_at: 'DESC' },
    });
  }

  // ================= GET BY PARENT =================
  async findByParent(parentId: string) {
    return await this.repo.find({
      where: { parent_id: parentId, is_deleted: false },
      relations: ['branch', 'academic_year', 'student', 'parent'],
      order: { created_at: 'DESC' },
    });
  }

  // ================= GET BY STUDENT =================
  async findByStudent(studentId: string) {
    return await this.repo.find({
      where: { student_id: studentId, is_deleted: false },
      relations: ['branch', 'academic_year', 'student', 'parent'],
      order: { created_at: 'DESC' },
    });
  }

  // ================= MARK SEEN =================
  async markSeen(id: string) {
    const data = await this.findOne(id);
    data.seen = 1;
    return await this.repo.save(data);
  }

  // ================= MARK CLICKED =================
  async markClicked(id: string) {
    const data = await this.findOne(id);
    data.clicked = 1;
    data.seen = 1;
    return await this.repo.save(data);
  }
}
