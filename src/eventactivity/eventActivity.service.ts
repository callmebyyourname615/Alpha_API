import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventActivity } from './eventActivity.entity';
import { FileService } from '../file/file.service';
import { File } from '../file/files.entity';

@Injectable()
export class EventActivityService {
  constructor(
    @InjectRepository(EventActivity)
    private readonly activityRepo: Repository<EventActivity>,
    private readonly fileService: FileService,
  ) {}

  // Create EventActivity with optional file paths
  async create(
    data: Partial<EventActivity>,
    filePaths?: string[],
  ): Promise<EventActivity> {
    const activity = this.activityRepo.create(data);
    const savedActivity = await this.activityRepo.save(activity);

    if (filePaths?.length) {
      for (const path of filePaths) {
        await this.fileService.create({
          module: 'event_activity',
          event_activity_id: savedActivity.id,
          file_path: path,
        });
      }
    }

    return savedActivity;
  }

  // Get all activities
  async findAll(): Promise<EventActivity[]> {
    return this.activityRepo.find({
      where: { is_deleted: false },
      relations: ['event', 'files'],
    });
  }

  // Get one activity
  async findOne(id: string): Promise<EventActivity> {
    const activity = await this.activityRepo.findOne({
      where: { id, is_deleted: false },
      relations: ['event', 'files'],
    });
    if (!activity) throw new NotFoundException('EventActivity not found');
    return activity;
  }

  // Update EventActivity
  async update(
    id: string,
    data: Partial<EventActivity>,
    filePaths?: string[],
  ): Promise<EventActivity> {
    const activity = await this.findOne(id);

    Object.assign(activity, data);
    const updated = await this.activityRepo.save(activity);

    // Update files (replace old ones if needed)
    if (filePaths?.length) {
      // Soft delete old files
      const oldFiles = await this.fileService.findByModuleAndOwner(
        'event_activity',
        updated.id,
      );
      for (const f of oldFiles) {
        await this.fileService.softDelete(f.id);
      }

      // Save new files
      for (const path of filePaths) {
        await this.fileService.create({
          module: 'event_activity',
          event_activity_id: updated.id,
          file_path: path,
        });
      }
    }

    return updated;
  }

  // Soft delete activity
  async delete(id: string): Promise<{ message: string }> {
    const activity = await this.findOne(id);

    // Soft delete related files first
    const files = await this.fileService.findByModuleAndOwner(
      'event_activity',
      activity.id,
    );
    for (const f of files) {
      await this.fileService.softDelete(f.id);
    }

    activity.is_deleted = true;
    await this.activityRepo.save(activity);

    return { message: 'EventActivity deleted' };
  }
}
