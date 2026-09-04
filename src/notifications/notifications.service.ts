import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { TaskAccessService } from '../task-access/task-access.service';
import { CacheService } from '../common/cache.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
    private readonly taskAccess: TaskAccessService,
    private readonly cache: CacheService,
  ) {}

  private readonly notificationRelations = [
    'branch',
    'academic_year',
    'student',
    'parent',
  ] as const;
  private readonly notificationListTtlSeconds = 60;

  // ================= CREATE =================
  async create(dto: CreateNotificationDto) {
    if (dto.module_type === 'TASK') {
      await this.taskAccess.assertAdminCanMutateTask(dto.module_id, dto.admin_id);
    }
    const data = this.repo.create(dto);
    const saved = await this.repo.save(data);
    await this.clearNotificationCache(saved);
    return saved;
  }

  // ================= GET ALL =================
  async findAll() {
    return this.cache.getOrSet('notifications:all', this.notificationListTtlSeconds, () =>
      this.repo.find({
        where: { is_deleted: false },
        relations: [...this.notificationRelations],
        order: { created_at: 'DESC' },
      }),
    );
  }

  // ================= GET BY ID =================
  async findOne(id: string) {
    return this.cache.getOrSet(`notifications:${id}`, 60, () =>
      this.findOneUncached(id),
    );
  }

  private async findOneUncached(id: string) {
    const data = await this.repo.findOne({
      where: { id, is_deleted: false },
      relations: [...this.notificationRelations],
    });

    if (!data) throw new NotFoundException('Notification not found');
    return data;
  }

  // ================= UPDATE =================
  async update(id: string, dto: UpdateNotificationDto) {
    const data = await this.findOneUncached(id);
    if ((dto as any).module_type === 'TASK' || data.module_type === 'TASK') {
      await this.taskAccess.assertAdminCanMutateTask((dto as any).module_id || data.module_id, (dto as any).admin_id || data.admin_id);
    }
    Object.assign(data, dto);
    const saved = await this.repo.save(data);
    await this.clearNotificationCache(saved);
    return saved;
  }

  // ================= DELETE (soft delete) =================
  async remove(id: string) {
    const data = await this.findOneUncached(id);
    if (data.module_type === 'TASK') {
      await this.taskAccess.assertAdminCanMutateTask(data.module_id, data.admin_id);
    }
    data.is_deleted = true;
    const saved = await this.repo.save(data);
    await this.clearNotificationCache(saved);
    return saved;
  }

  // ================= GET BY BRANCH =================
  async findByBranch(body: { branch_id: string }) {
    return this.cache.getOrSet(
      `notifications:branch:${body.branch_id}`,
      this.notificationListTtlSeconds,
      () =>
      this.repo.find({
        where: { branch_id: body.branch_id, is_deleted: false },
        relations: [...this.notificationRelations],
        order: { created_at: 'DESC' },
      }),
    );
  }

  // ================= GET BY PARENT =================
  async findByParent(parentId: string) {
    return this.cache.getOrSet(
      `notifications:parent:${parentId}`,
      this.notificationListTtlSeconds,
      () =>
      this.repo.find({
        where: { parent_id: parentId, is_deleted: false },
        relations: [...this.notificationRelations],
        order: { created_at: 'DESC' },
      }),
    );
  }

  // ================= GET BY STUDENT =================
  async findByStudent(studentId: string) {
    return this.cache.getOrSet(
      `notifications:student:${studentId}`,
      this.notificationListTtlSeconds,
      () =>
      this.repo.find({
        where: { student_id: studentId, is_deleted: false },
        relations: [...this.notificationRelations],
        order: { created_at: 'DESC' },
      }),
    );
  }

  // ================= MARK SEEN =================
  async markSeen(id: string) {
    const data = await this.findOneUncached(id);
    data.seen = 1;
    const saved = await this.repo.save(data);
    await this.clearNotificationCache(saved);
    return saved;
  }

  // ================= MARK CLICKED =================
  async markClicked(id: string) {
    const data = await this.findOneUncached(id);
    data.clicked = 1;
    data.seen = 1;
    const saved = await this.repo.save(data);
    await this.clearNotificationCache(saved);
    return saved;
  }

  private async clearNotificationCache(notification?: Notification): Promise<void> {
    await this.cache.del('notifications:all');
    await this.cache.delPattern('notifications:branch:*');
    await this.cache.delPattern('notifications:parent:*');
    await this.cache.delPattern('notifications:student:*');

    const keys = [
      notification?.id,
      notification?.branch_id ? `branch:${notification.branch_id}` : '',
      notification?.parent_id ? `parent:${notification.parent_id}` : '',
      notification?.student_id ? `student:${notification.student_id}` : '',
    ].filter(Boolean);

    await Promise.all(
      keys.map((key) => this.cache.del(`notifications:${key}`)),
    );
  }
}
