import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './files.entity';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
  ) {}

  // Create a file record
  async create(data: Partial<File>): Promise<File> {
    const newFile = this.fileRepo.create(data);
    return this.fileRepo.save(newFile);
  }

  // Get all files
  async findAll(): Promise<File[]> {
    return this.fileRepo.find();
  }

  // Get a file by ID
  async findOne(id: string): Promise<File> {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  // Find files by module + related entity
  async findByModuleAndOwner(
    module: 'event' | 'event_activity' | 'task' | 'comment' | 'task_submission' | 'gallery',
    ownerId: string,
  ): Promise<File[]> {
    const columnMap = {
      event: 'event_id',
      event_activity: 'event_activity_id',
      task: 'task_id',
      comment: 'comment_id',
      task_submission: 'task_submission_id',
      gallery: 'gallery_id',
    } as const;

    const where: any = { 
      [columnMap[module]]: ownerId,
      is_deleted: false,
    };
    return this.fileRepo.find({ where });
  }

  // Soft delete a file
  async softDelete(id: string): Promise<{ message: string }> {
    const file = await this.findOne(id);
    file.is_deleted = true;
    await this.fileRepo.save(file);
    return { message: 'File soft-deleted' };
  }

  // Update file record
  async update(id: string, data: Partial<File>): Promise<File> {
    const file = await this.findOne(id); // ตรวจสอบก่อนว่า file มีอยู่
    Object.assign(file, data); // อัปเดต property จาก data
    return this.fileRepo.save(file); // บันทึกลง DB
  }
}
