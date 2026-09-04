import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskNote } from './task-note.entity';
import { CreateTaskNoteDto } from './dto/create-task-note.dto';
import { UpdateTaskNoteDto } from './dto/update-task-note.dto';
import { TaskAccessService } from '../task-access/task-access.service';

@Injectable()
export class TaskNoteService {
  constructor(
    @InjectRepository(TaskNote)
    private readonly repo: Repository<TaskNote>,
    private readonly taskAccess: TaskAccessService,
  ) {}

  // Notes are private: only the authoring admin's notes are ever returned.
  async findForAdmin(taskId: string, adminId: string): Promise<TaskNote[]> {
    return this.repo.find({
      where: { task_id: taskId, admin_id: adminId },
      order: { created_at: 'DESC' },
    });
  }

  async create(dto: CreateTaskNoteDto): Promise<TaskNote> {
    await this.taskAccess.assertAdminCanMutateTask(dto.task_id, dto.admin_id);
    const note = this.repo.create(dto);
    return this.repo.save(note);
  }

  async update(id: string, dto: UpdateTaskNoteDto, adminId?: string): Promise<TaskNote> {
    const note = await this.repo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Task note not found');
    await this.taskAccess.assertAdminCanMutateTask(note.task_id, adminId || note.admin_id);
    note.note = dto.note;
    return this.repo.save(note);
  }

  async delete(id: string, adminId?: string): Promise<{ message: string }> {
    const note = await this.repo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Task note not found');
    await this.taskAccess.assertAdminCanMutateTask(note.task_id, adminId || note.admin_id);
    await this.repo.remove(note);
    return { message: 'Task note deleted' };
  }
}
