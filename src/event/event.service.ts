import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './events.entity';
import { File } from '../file/files.entity';
import { FileService } from '../file/file.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    private readonly fileService: FileService,
  ) {}

  // Create event + optional files
  async create(
    dto: CreateEventDto,
    files?: Express.Multer.File[],
  ): Promise<Event> {
    const event = this.eventRepo.create(dto);
    const savedEvent = await this.eventRepo.save(event);

    if (files?.length) {
      for (const file of files) {
        await this.fileService.create({
          module: 'event',
          event_id: savedEvent.id,
          file_path: file.path,
        });
      }
    }

    return savedEvent;
  }

  // Get all events (exclude deleted)
  async findAll(): Promise<Event[]> {
    return this.eventRepo.find({
      where: { is_deleted: false },
      relations: ['files', 'activities'],
    });
  }

  // Get one event
  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id, is_deleted: false },
      relations: ['files', 'activities'],
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  // Update event + optional files
  async update(
    id: string,
    data: Partial<Event>,
    files?: Express.Multer.File[],
  ): Promise<Event> {
    const event = await this.findOne(id);

    // อัปเดตข้อมูลหลักของ Event
    Object.assign(event, data);
    const updatedEvent = await this.eventRepo.save(event);

    if (files?.length) {
      for (const file of files) {
        // ถ้า file.id มี => update, ถ้าไม่มี => create
        if ((file as any).id) {
          await this.fileService.update((file as any).id, {
            module: 'event',
            event_id: updatedEvent.id,
            file_path: file.path,
          });
        } else {
          await this.fileService.create({
            module: 'event',
            event_id: updatedEvent.id,
            file_path: file.path,
          });
        }
      }
    }

    return updatedEvent;
  }

  // Soft delete event along with its files
  async delete(id: string): Promise<{ message: string }> {
    const event = await this.findOne(id);

    // 1️⃣ ดึงไฟล์ทั้งหมดที่เกี่ยวข้องกับ Event
    const files = await this.fileService.findByModuleAndOwner('event', id);

    // 2️⃣ ลบไฟล์ทั้งหมด (soft delete)
    for (const file of files) {
      await this.fileService.softDelete(file.id);
    }

    // 3️⃣ ลบ Event
    event.is_deleted = true;
    await this.eventRepo.save(event);

    return { message: 'Event and its files deleted' };
  }
}
