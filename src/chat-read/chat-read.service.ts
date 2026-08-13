import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ChatRead, ChatReaderType } from './chat-read.entity';
import { TaskAccessService } from '../task-access/task-access.service';

export interface MarkReadDto {
  module_type: string;
  module_id: string;
  reader_id: string;
  reader_type: ChatReaderType;
  student_id?: string | null;
}

@Injectable()
export class ChatReadService {
  constructor(
    @InjectRepository(ChatRead)
    private readonly repo: Repository<ChatRead>,
    private readonly taskAccess: TaskAccessService,
  ) {}

  async markRead(dto: MarkReadDto): Promise<ChatRead> {
    if (dto.module_type === 'TASK' && dto.reader_type === ChatReaderType.ADMIN) {
      await this.taskAccess.assertAdminCanMutateTask(dto.module_id, dto.reader_id);
    }

    const studentId = dto.student_id ?? null;
    let cursor = await this.repo.findOne({
      where: {
        module_type: dto.module_type,
        module_id: dto.module_id,
        reader_id: dto.reader_id,
        reader_type: dto.reader_type,
        // undefined here would make TypeORM drop the filter entirely
        // (matching any student_id) instead of matching the legacy
        // unscoped cursor — IsNull() is required for a real NULL match.
        student_id: studentId === null ? IsNull() : studentId,
      },
    });

    if (!cursor) {
      cursor = this.repo.create({ ...dto, student_id: studentId });
    }
    cursor.last_read_at = new Date();
    return this.repo.save(cursor);
  }

  async getCursors(moduleType: string, moduleId?: string): Promise<ChatRead[]> {
    const where: { module_type: string; module_id?: string } = { module_type: moduleType };
    if (moduleId) where.module_id = moduleId;
    return this.repo.find({ where });
  }
}
