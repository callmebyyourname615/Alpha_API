import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuRead } from './menu-read.entity';
import {
  MarkMenuReadsDto,
  MenuResource,
  SUPPORTED_MENU_RESOURCES,
} from './dto/mark-menu-reads.dto';

@Injectable()
export class MenuReadsService {
  constructor(
    @InjectRepository(MenuRead)
    private readonly repo: Repository<MenuRead>,
  ) {}

  /** Returns the list of `resourceId`s already marked as read. */
  async findReadIds(
    studentId: string,
    resource: MenuResource,
  ): Promise<string[]> {
    const rows = await this.repo.find({
      where: { studentId, resource },
      select: { resourceId: true },
    });
    return rows.map((row) => row.resourceId);
  }

  /** Returns read ids grouped by resource for one student. */
  async findAllForStudent(
    studentId: string,
  ): Promise<Record<MenuResource, string[]>> {
    const rows = await this.repo.find({
      where: { studentId },
      select: { resource: true, resourceId: true },
    });

    const result = SUPPORTED_MENU_RESOURCES.reduce(
      (acc, key) => {
        acc[key] = [];
        return acc;
      },
      {} as Record<MenuResource, string[]>,
    );

    for (const row of rows) {
      const resource = row.resource as MenuResource;
      if (result[resource]) result[resource].push(row.resourceId);
    }
    return result;
  }

  /**
   * Idempotent bulk mark-as-read. Skips duplicates via the unique
   * (student_id, resource, resource_id) index. Returns the total
   * number of read records for that scope after the upsert.
   */
  async markRead(dto: MarkMenuReadsDto): Promise<{ count: number }> {
    const unique = Array.from(new Set(dto.resourceIds.filter(Boolean)));
    if (unique.length === 0) {
      return { count: await this.countFor(dto.studentId, dto.resource) };
    }

    await this.repo
      .createQueryBuilder()
      .insert()
      .into(MenuRead)
      .values(
        unique.map((resourceId) => ({
          studentId: dto.studentId,
          resource: dto.resource,
          resourceId,
        })),
      )
      .orIgnore()
      .execute();

    return { count: await this.countFor(dto.studentId, dto.resource) };
  }

  private countFor(studentId: string, resource: MenuResource) {
    return this.repo.count({ where: { studentId, resource } });
  }
}
